use crate::sunshine;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[cfg(target_os = "windows")]
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;

/// 快捷方式解析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LnkInfo {
    pub name: String,
    #[serde(rename = "targetPath")]
    pub target_path: String,
    #[serde(rename = "workingDir")]
    pub working_dir: String,
    pub arguments: String,
}

/// 通用文本文件保存（弹出系统保存对话框）
/// 供远程 WebUI 页面通过 __TAURI_INTERNALS__.invoke 调用
#[tauri::command]
pub async fn save_text_file(
    app: tauri::AppHandle,
    content: String,
    default_name: String,
    filter_name: String,
    extensions: Vec<String>,
) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    use tokio::sync::oneshot;

    let ext_refs: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(&filter_name, &ext_refs)
        .save_file(move |file_path_opt| {
            let _ = tx.send(file_path_opt);
        });

    let file_path = rx
        .await
        .map_err(|_| "dialog channel error".to_string())?
        .ok_or_else(|| "cancelled".to_string())?;

    let path_buf = std::path::PathBuf::from(file_path.to_string());
    std::fs::write(&path_buf, &content).map_err(|e| format!("write failed: {}", e))?;

    Ok(path_buf.display().to_string())
}

/// 获取 ICC 颜色配置文件列表
#[tauri::command]
pub async fn get_icc_file_list() -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let color_dir = std::env::var("windir")
            .map(|windir| PathBuf::from(windir).join("System32\\spool\\drivers\\color"))
            .unwrap_or_else(|_| PathBuf::from("C:\\Windows\\System32\\spool\\drivers\\color"));

        match std::fs::read_dir(&color_dir) {
            Ok(entries) => {
                let mut files = Vec::new();
                for entry in entries {
                    if let Ok(entry) = entry {
                        if let Some(file_name) = entry.file_name().to_str() {
                            // 只包含 .icc 和 .icm 文件
                            let lower_name = file_name.to_ascii_lowercase();
                            if lower_name.ends_with(".icc") || lower_name.ends_with(".icm") {
                                files.push(file_name.to_string());
                            }
                        }
                    }
                }
                files.sort(); // 按字母顺序排序
                Ok(files)
            }
            Err(e) => Err(format!("读取目录失败: {}", e)),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec![]) // 非 Windows 系统返回空列表
    }
}

/// 读取指定目录的文件列表
#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<String>, String> {
    match std::fs::read_dir(&path) {
        Ok(entries) => {
            let mut files = Vec::new();
            for entry in entries {
                if let Ok(entry) = entry {
                    if let Some(file_name) = entry.file_name().to_str() {
                        files.push(file_name.to_string());
                    }
                }
            }
            files.sort();
            Ok(files)
        }
        Err(e) => Err(format!("读取目录失败: {}", e)),
    }
}

/// 读取图片文件并返回 Base64 编码的 Data URL
#[tauri::command]
pub async fn read_image_as_data_url(path: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    // 读取文件
    let file_bytes = fs::read(&path).map_err(|e| format!("读取文件失败: {}", e))?;

    debug!(
        "📖 读取文件成功: {}, 大小: {} bytes",
        path,
        file_bytes.len()
    );

    // 根据扩展名确定 MIME 类型
    let path_obj = Path::new(&path);
    let extension = path_obj
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let mime_type = match extension.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => "image/png", // 默认
    };

    // 转换为 Base64
    use base64::{Engine as _, engine::general_purpose};
    let base64 = general_purpose::STANDARD.encode(&file_bytes);

    // 构造 Data URL
    let data_url = format!("data:{};base64,{}", mime_type, base64);

    debug!(
        "✅ Data URL 生成成功, MIME: {}, Base64 长度: {}",
        mime_type,
        base64.len()
    );

    Ok(data_url)
}

/// 复制图片文件到 Sunshine assets 目录
/// 返回相对于 Sunshine Web 服务器的 URL 路径（/boxart/xxx.jpg）
#[tauri::command]
pub async fn copy_image_to_assets(source_path: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let source = Path::new(&source_path);

    // 验证源文件存在
    if !source.exists() {
        return Err(format!("源文件不存在: {}", source_path));
    }

    let assets_dir = sunshine::assets_dir();

    // 创建 assets 目录（如果不存在）
    fs::create_dir_all(&assets_dir).map_err(|e| format!("创建目录失败: {}", e))?;

    // 获取文件名
    let file_name = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "无效的文件名".to_string())?;

    // 生成唯一文件名（避免覆盖）
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let extension = source.extension().and_then(|e| e.to_str()).unwrap_or("jpg");
    let unique_name = format!(
        "bg_{}_{}.{}",
        timestamp,
        file_name.replace(|c: char| !c.is_alphanumeric(), "_"),
        extension
    );

    // 目标路径
    let dest_path = assets_dir.join(&unique_name);

    // 复制文件
    fs::copy(source, &dest_path).map_err(|e| format!("复制文件失败: {}", e))?;

    info!("✅ 图片已复制到: {:?}", dest_path);

    // 返回相对于 Sunshine Web 根目录的 URL 路径
    let web_url = format!("/boxart/{}", unique_name);

    Ok(web_url)
}

/// 清理 covers 目录中未被使用的封面图片
#[tauri::command]
pub async fn cleanup_unused_covers() -> Result<serde_json::Value, String> {
    use serde_json::json;
    use std::collections::HashSet;
    use std::fs;

    info!("🧹 开始清理无用封面...");

    let covers_dir = sunshine::covers_dir();
    let apps_json_path = sunshine::config_dir().join("apps.json");

    debug!("📂 使用 covers 目录: {:?}", covers_dir);
    debug!("📄 使用 apps.json 路径: {:?}", apps_json_path);

    // 读取 apps.json 获取所有正在使用的图片
    let used_images: HashSet<String> = if apps_json_path.exists() {
        match fs::read_to_string(&apps_json_path) {
            Ok(content) => {
                // 检查文件内容是否为空或只包含空白字符
                let trimmed_content = content.trim();
                if trimmed_content.is_empty() {
                    warn!("⚠️  apps.json 文件为空，跳过解析");
                    HashSet::new()
                } else {
                    // 尝试解析 JSON
                    match serde_json::from_str::<serde_json::Value>(trimmed_content) {
                        Ok(apps) => {
                            let mut images = HashSet::new();

                            if let Some(apps_array) = apps.get("apps").and_then(|a| a.as_array()) {
                                for app in apps_array {
                                    if let Some(image_path) =
                                        app.get("image-path").and_then(|p| p.as_str())
                                    {
                                        // 跳过无效或默认图片
                                        if image_path.is_empty() || image_path == "desktop" {
                                            continue;
                                        }

                                        // 提取文件名（去除路径）
                                        let filename = image_path
                                            .split('/')
                                            .last()
                                            .or_else(|| image_path.split('\\').last())
                                            .unwrap_or(image_path);

                                        if !filename.is_empty() && filename != "desktop" {
                                            // 始终保存文件名
                                            images.insert(filename.to_string());

                                            // 如果路径包含分隔符，也保存完整路径
                                            if image_path.contains('/') || image_path.contains('\\')
                                            {
                                                images.insert(image_path.to_string());
                                                debug!(
                                                    "  📌 使用中: {} (完整路径: {})",
                                                    filename, image_path
                                                );
                                            } else {
                                                debug!("  📌 使用中: {}", filename);
                                            }
                                        }
                                    }
                                }
                            }
                            images
                        }
                        Err(e) => {
                            warn!("⚠️  解析 apps.json 失败: {}，跳过解析", e);
                            HashSet::new()
                        }
                    }
                }
            }
            Err(e) => {
                warn!("⚠️  读取 apps.json 失败: {}，跳过解析", e);
                HashSet::new()
            }
        }
    } else {
        debug!("📄 apps.json 不存在，跳过解析");
        HashSet::new()
    };

    debug!("  正在使用的封面数: {}", used_images.len());

    let mut deleted_count = 0;
    let mut freed_space: u64 = 0;
    let mut errors = Vec::new();

    // === 1. 清理 covers 目录中未使用的封面 ===
    if covers_dir.exists() {
        debug!("\n📂 扫描 covers 目录...");
        let entries =
            fs::read_dir(&covers_dir).map_err(|e| format!("读取 covers 目录失败: {}", e))?;

        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();

                if path.is_file() {
                    if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                        // 更安全的检查：检查文件名是否在任何路径中被使用
                        let is_used = {
                            // 直接检查文件名
                            used_images.contains(filename) ||
                            // 检查是否有路径以这个文件名结尾
                            used_images.iter().any(|used_path| {
                                used_path.ends_with(&format!("/{}", filename)) ||
                                used_path.ends_with(&format!("\\{}", filename)) ||
                                used_path == filename
                            })
                        };

                        if !is_used {
                            // 获取文件大小
                            let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

                            // 删除文件
                            match fs::remove_file(&path) {
                                Ok(_) => {
                                    debug!("  🗑️  [封面] {}", filename);
                                    deleted_count += 1;
                                    freed_space += size;
                                }
                                Err(e) => {
                                    let error_msg = format!("删除封面 {} 失败: {}", filename, e);
                                    error!("  ❌ {}", error_msg);
                                    errors.push(error_msg);
                                }
                            }
                        } else {
                            debug!("  ✅ [保护] {} (正在使用中)", filename);
                        }
                    }
                }
            }
        }
    }

    // === 2. 清理 config 目录中的 temp_ 临时文件 ===
    let config_dir = sunshine::config_dir();
    debug!("\n📂 扫描 config 目录中的临时文件...");
    if config_dir.exists() {
        match fs::read_dir(&config_dir) {
            Ok(entries) => {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();

                        if path.is_file() {
                            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                                // 删除 temp_ 开头的临时文件
                                if filename.starts_with("temp_") {
                                    let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

                                    match fs::remove_file(&path) {
                                        Ok(_) => {
                                            debug!("  🗑️  [临时] {}", filename);
                                            deleted_count += 1;
                                            freed_space += size;
                                        }
                                        Err(e) => {
                                            let error_msg =
                                                format!("删除临时文件 {} 失败: {}", filename, e);
                                            error!("  ❌ {}", error_msg);
                                            errors.push(error_msg);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let error_msg = format!("读取 config 目录失败: {}", e);
                warn!("  ⚠️  {}", error_msg);
                // 不返回错误，继续执行
            }
        }
    }

    let message = if deleted_count > 0 {
        format!(
            "成功删除 {} 个无用文件，释放 {:.2} KB",
            deleted_count,
            freed_space as f64 / 1024.0
        )
    } else {
        "没有发现需要清理的文件".to_string()
    };

    info!("\n✅ 清理完成: {}", message);

    Ok(json!({
        "success": true,
        "message": message,
        "deleted_count": deleted_count,
        "freed_space": freed_space,
        "errors": errors
    }))
}

/// 解析 Windows 快捷方式 (.lnk) 文件
#[tauri::command]
pub async fn resolve_lnk_target(lnk_path: String) -> Result<LnkInfo, String> {
    #[cfg(target_os = "windows")]
    {
        resolve_lnk_windows(&lnk_path)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("快捷方式解析仅支持 Windows 系统".to_string())
    }
}

#[cfg(target_os = "windows")]
fn resolve_lnk_windows(lnk_path: &str) -> Result<LnkInfo, String> {
    use std::path::Path;
    use windows::Win32::System::Com::{
        CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, CoCreateInstance, CoInitializeEx,
        CoUninitialize, IPersistFile, STGM_READ,
    };
    use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};
    use windows::core::Interface;

    info!("🔗 解析快捷方式: {}", lnk_path);

    // 初始化 COM
    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
    }

    let result = (|| -> Result<LnkInfo, String> {
        // 创建 ShellLink 对象
        let shell_link: IShellLinkW = unsafe {
            CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)
                .map_err(|e| format!("创建 ShellLink 失败: {:?}", e))?
        };

        // 获取 IPersistFile 接口
        let persist_file: IPersistFile = shell_link
            .cast()
            .map_err(|e| format!("获取 IPersistFile 失败: {:?}", e))?;

        // 加载 .lnk 文件
        let wide_path: Vec<u16> = OsStr::new(lnk_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        unsafe {
            persist_file
                .Load(windows::core::PCWSTR(wide_path.as_ptr()), STGM_READ)
                .map_err(|e| format!("加载 .lnk 文件失败: {:?}", e))?;
        }

        // 获取目标路径
        let mut target_path_buf: [u16; 260] = [0; 260];
        let mut find_data: windows::Win32::Storage::FileSystem::WIN32_FIND_DATAW =
            unsafe { std::mem::zeroed() };

        unsafe {
            shell_link
                .GetPath(
                    &mut target_path_buf,
                    &mut find_data,
                    windows::Win32::UI::Shell::SLGP_RAWPATH.0 as u32,
                )
                .map_err(|e| format!("获取目标路径失败: {:?}", e))?;
        }

        let target_path = String::from_utf16_lossy(
            &target_path_buf[..target_path_buf
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(target_path_buf.len())],
        );

        // 获取工作目录
        let mut working_dir_buf: [u16; 260] = [0; 260];
        unsafe {
            let _ = shell_link.GetWorkingDirectory(&mut working_dir_buf);
        }

        let working_dir = String::from_utf16_lossy(
            &working_dir_buf[..working_dir_buf
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(working_dir_buf.len())],
        );

        // 获取参数
        let mut arguments_buf: [u16; 1024] = [0; 1024];
        unsafe {
            let _ = shell_link.GetArguments(&mut arguments_buf);
        }

        let arguments = String::from_utf16_lossy(
            &arguments_buf[..arguments_buf
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(arguments_buf.len())],
        );

        // 从 lnk 文件名获取名称
        let lnk_file_path = Path::new(lnk_path);
        let name = lnk_file_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();

        debug!("✅ 快捷方式解析成功:");
        debug!("   名称: {}", name);
        debug!("   目标: {}", target_path);
        debug!("   工作目录: {}", working_dir);
        debug!("   参数: {}", arguments);

        Ok(LnkInfo {
            name,
            target_path,
            working_dir,
            arguments,
        })
    })();

    // 清理 COM
    unsafe {
        CoUninitialize();
    }

    result
}
