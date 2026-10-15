// ControllerMeta 集成模块
//
// ControllerMeta (https://github.com/HK560/ControllerMeta) 是一个基于 WebView2 的
// 高精度手柄分析工具。官方发布形式为单个 Windows EXE，本模块负责：
//   1. 检测本地是否已安装（%LOCALAPPDATA%\Sunshine\controllermeta\ControllerMeta.exe）
//   2. 查询 GitHub Releases 最新版本
//   3. 下载并落盘（带进度事件）
//   4. 启动 EXE（GUI 进程，不捕获窗口）

use crate::github_download::{
    DownloadCandidate, DownloadRequest, download_to_file_from_candidates,
};
use log::info;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

// ========== 常量 ==========

const GITHUB_API_LATEST: &str = "https://api.github.com/repos/HK560/ControllerMeta/releases/latest";
const BINARY_NAME: &str = "ControllerMeta.exe";
const INSTALL_SUBDIR: &str = "controllermeta";
const DOWNLOAD_PROGRESS_EVENT: &str = "controllermeta-download-progress";

const MAX_DOWNLOAD_BYTES: u64 = 256 * 1024 * 1024;

/// 已启动的子进程句柄（仅用于判断是否由我们拉起）
static CHILD_PROCESS: Lazy<Mutex<Option<std::process::Child>>> = Lazy::new(|| Mutex::new(None));

// ========== 数据结构 ==========

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ControllerMetaStatus {
    /// 是否已安装
    pub installed: bool,
    /// 是否正在运行
    pub running: bool,
    /// 安装目录
    pub install_path: String,
    /// 可执行文件完整路径
    pub binary_path: String,
    /// 已安装版本（来自 version.txt）
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ControllerMetaRelease {
    pub version: String,
    pub download_url: Option<String>,
    pub download_name: Option<String>,
    pub download_size: u64,
    pub release_page: String,
    pub release_notes: String,
}

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
    assets: Vec<GitHubAsset>,
    #[serde(default)]
    body: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
    size: u64,
    #[serde(default)]
    digest: Option<String>,
}

// ========== 路径工具 ==========

fn get_install_dir() -> PathBuf {
    if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
        return PathBuf::from(local_app_data)
            .join("Sunshine")
            .join(INSTALL_SUBDIR);
    }
    // fallback：与控制面板同级
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            return parent.join(INSTALL_SUBDIR);
        }
    }
    PathBuf::from(format!("./{}", INSTALL_SUBDIR))
}

fn get_binary_path() -> PathBuf {
    get_install_dir().join(BINARY_NAME)
}

fn get_version_file() -> PathBuf {
    get_install_dir().join("version.txt")
}

fn read_installed_version() -> String {
    std::fs::read_to_string(get_version_file())
        .map(|s| s.trim().to_string())
        .unwrap_or_default()
}

// ========== 进程检查 ==========

fn is_process_running() -> bool {
    // 先检查我们自己 spawn 的子进程
    {
        let mut guard = CHILD_PROCESS.lock().unwrap();
        if let Some(ref mut child) = *guard {
            match child.try_wait() {
                Ok(None) => return true,
                Ok(Some(_)) | Err(_) => *guard = None,
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        if let Ok(output) = std::process::Command::new("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {}", BINARY_NAME), "/NH"])
            .creation_flags(0x08000000)
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            return stdout.to_lowercase().contains(&BINARY_NAME.to_lowercase());
        }
    }

    false
}

// ========== Tauri 命令 ==========

#[tauri::command]
pub async fn controllermeta_get_status() -> Result<ControllerMetaStatus, String> {
    let install_dir = get_install_dir();
    let binary_path = get_binary_path();
    let installed = binary_path.exists();
    let running = is_process_running();
    let version = if installed {
        read_installed_version()
    } else {
        String::new()
    };

    Ok(ControllerMetaStatus {
        installed,
        running,
        install_path: install_dir.to_string_lossy().to_string(),
        binary_path: binary_path.to_string_lossy().to_string(),
        version,
    })
}

async fn fetch_official_release() -> Result<GitHubRelease, String> {
    let client = reqwest::Client::builder()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("sunshine-control-panel")
        .build()
        .map_err(|e| e.to_string())?;
    let mut response = client
        .get(GITHUB_API_LATEST)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if body.len().saturating_add(chunk.len()) > 2 * 1024 * 1024 {
            return Err("ControllerMeta release metadata exceeds size limit".into());
        }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|e| e.to_string())
}

fn verified_asset<'a>(
    release: &'a GitHubRelease,
    url: &str,
    version: &str,
) -> Result<(&'a GitHubAsset, String), String> {
    if version.trim_start_matches('v') != release.tag_name.trim_start_matches('v') {
        return Err("ControllerMeta release changed; check for updates again".into());
    }
    let asset = release
        .assets
        .iter()
        .find(|a| a.browser_download_url == url)
        .ok_or("ControllerMeta asset is not in the official release")?;
    let parsed = reqwest::Url::parse(url).map_err(|e| e.to_string())?;
    if parsed.scheme() != "https"
        || parsed.host_str() != Some("github.com")
        || !parsed.username().is_empty()
        || parsed.password().is_some()
        || !parsed
            .path()
            .starts_with("/HK560/ControllerMeta/releases/download/")
        || !asset.name.to_ascii_lowercase().ends_with(".exe")
        || asset.size == 0
        || asset.size > MAX_DOWNLOAD_BYTES
    {
        return Err("Invalid ControllerMeta release asset".into());
    }
    let hash = asset
        .digest
        .as_deref()
        .and_then(|d| d.strip_prefix("sha256:"))
        .filter(|h| h.len() == 64 && h.bytes().all(|c| c.is_ascii_hexdigit()))
        .ok_or("Official ControllerMeta release has no valid SHA-256; download refused")?;
    Ok((asset, hash.to_ascii_lowercase()))
}

#[tauri::command]
pub async fn controllermeta_check_release() -> Result<ControllerMetaRelease, String> {
    let release = fetch_official_release().await?;
    let asset = release
        .assets
        .iter()
        .find(|a| a.name.eq_ignore_ascii_case(BINARY_NAME))
        .or_else(|| {
            release
                .assets
                .iter()
                .find(|a| a.name.to_ascii_lowercase().ends_with(".exe"))
        });
    Ok(ControllerMetaRelease {
        version: release.tag_name.clone(),
        download_url: asset.map(|a| a.browser_download_url.clone()),
        download_name: asset.map(|a| a.name.clone()),
        download_size: asset.map_or(0, |a| a.size),
        release_page: release.html_url,
        release_notes: release.body.unwrap_or_default(),
    })
}

/// 下载 ControllerMeta.exe 到安装目录
///
/// 发送 `controllermeta-download-progress` 事件上报进度：
///   { progress: u32 (0-100), downloaded: u64, total: u64 }
#[tauri::command]
pub async fn controllermeta_download(
    url: String,
    version: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    use tauri::Emitter;

    // Re-fetch trusted metadata in the backend; frontend arguments are not a trust anchor.
    let release = fetch_official_release().await?;
    let (asset, expected_hash) = verified_asset(&release, &url, &version)?;
    let install_dir = get_install_dir();
    std::fs::create_dir_all(&install_dir).map_err(|e| e.to_string())?;
    let final_path = get_binary_path();
    let temp_path = install_dir.join(format!("{}.download", BINARY_NAME));
    let candidates = [DownloadCandidate {
        name: "github",
        url: url.clone(),
    }];
    let outcome = download_to_file_from_candidates(
        DownloadRequest {
            url: &url,
            destination: &temp_path,
            expected_size: Some(asset.size),
            expected_sha256: Some(&expected_hash),
            max_size: Some(MAX_DOWNLOAD_BYTES),
            user_agent: "sunshine-control-panel",
            connect_timeout: std::time::Duration::from_secs(10),
            response_timeout: std::time::Duration::from_secs(30),
            idle_timeout: std::time::Duration::from_secs(20),
            overall_timeout: Some(std::time::Duration::from_secs(600)),
        },
        &candidates,
        |progress| {
            let _ = app_handle.emit(
                DOWNLOAD_PROGRESS_EVENT,
                serde_json::json!({
                    "progress": (progress.downloaded.saturating_mul(100) / asset.size).min(100),
                    "downloaded": progress.downloaded,
                    "total": asset.size,
                }),
            );
        },
    )
    .await
    .map_err(|e| e.to_string())?;
    info!(
        "Verified ControllerMeta download ({} bytes)",
        outcome.downloaded
    );

    // 如果目标文件正在运行，重命名会失败；返回友好提示
    if final_path.exists() {
        if let Err(e) = std::fs::remove_file(&final_path) {
            let _ = std::fs::remove_file(&temp_path);
            return Err(format!(
                "无法覆盖已有版本，请先关闭 ControllerMeta 后重试: {}",
                e
            ));
        }
    }

    std::fs::rename(&temp_path, &final_path).map_err(|e| {
        let _ = std::fs::remove_file(&temp_path);
        format!("落盘失败: {}", e)
    })?;

    // 记录版本号
    if !version.is_empty() {
        let clean = version.trim_start_matches('v');
        let _ = std::fs::write(get_version_file(), clean);
    }

    info!("✅ ControllerMeta 安装完成: {:?}", final_path);
    Ok(final_path.to_string_lossy().to_string())
}

/// 启动 ControllerMeta（GUI 进程，fire-and-forget）
#[tauri::command]
pub async fn controllermeta_launch() -> Result<String, String> {
    let binary_path = get_binary_path();
    if !binary_path.exists() {
        return Err("ControllerMeta 未安装".to_string());
    }

    // 如果已在运行，不再重复启动
    if is_process_running() {
        info!("ℹ️ ControllerMeta 已在运行");
        return Ok("already-running".to_string());
    }

    let install_dir = get_install_dir();
    info!("🎮 启动 ControllerMeta: {:?}", binary_path);

    // Preserve Windows download-origin protections.
    #[cfg(target_os = "windows")]
    let child = {
        use std::os::windows::process::CommandExt;
        // DETACHED_PROCESS(0x00000008)：与父控制台脱钩
        // 不使用 CREATE_BREAKAWAY_FROM_JOB：若父进程所在的 Job 对象禁止 breakaway
        // 会触发 ERROR_ACCESS_DENIED (os error 5)
        std::process::Command::new(&binary_path)
            .current_dir(&install_dir)
            .creation_flags(0x00000008)
            .spawn()
            .map_err(|e| format!("启动 ControllerMeta 失败: {}", e))?
    };

    #[cfg(not(target_os = "windows"))]
    let child = std::process::Command::new(&binary_path)
        .current_dir(&install_dir)
        .spawn()
        .map_err(|e| format!("启动 ControllerMeta 失败: {}", e))?;

    let pid = child.id();
    *CHILD_PROCESS.lock().unwrap() = Some(child);
    Ok(format!("started:{}", pid))
}

#[tauri::command]
pub fn controllermeta_get_install_path() -> String {
    get_install_dir().to_string_lossy().to_string()
}

/// 卸载：删除整个安装目录
#[tauri::command]
pub async fn controllermeta_uninstall() -> Result<String, String> {
    if is_process_running() {
        return Err("ControllerMeta 正在运行，请先关闭后再卸载".to_string());
    }
    let install_dir = get_install_dir();
    if !install_dir.exists() {
        return Ok("not-installed".to_string());
    }
    std::fs::remove_dir_all(&install_dir).map_err(|e| format!("删除安装目录失败: {}", e))?;
    info!("🗑️ ControllerMeta 已卸载: {:?}", install_dir);
    Ok("uninstalled".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn release() -> GitHubRelease {
        GitHubRelease {
            tag_name: "v1.0".into(), html_url: String::new(), body: None,
            assets: vec![GitHubAsset {
                name: "ControllerMeta.exe".into(), size: 100,
                browser_download_url: "https://github.com/HK560/ControllerMeta/releases/download/v1.0/ControllerMeta.exe".into(),
                digest: Some(format!("sha256:{}", "a".repeat(64))),
            }],
        }
    }
    #[test]
    fn requires_official_asset_and_release_version() {
        let r = release();
        assert!(verified_asset(&r, &r.assets[0].browser_download_url, "1.0").is_ok());
        assert!(verified_asset(&r, &r.assets[0].browser_download_url, "v2.0").is_err());
        assert!(verified_asset(&r, "https://example.com/ControllerMeta.exe", "v1.0").is_err());
    }
    #[test]
    fn rejects_missing_or_malformed_digest_and_oversized_assets() {
        let mut r = release();
        for digest in [
            None,
            Some("sha256:abc".into()),
            Some(format!("sha256:{}", "z".repeat(64))),
        ] {
            r.assets[0].digest = digest;
            assert!(verified_asset(&r, &r.assets[0].browser_download_url, "v1.0").is_err());
        }
        r.assets[0].digest = Some(format!("sha256:{}", "a".repeat(64)));
        r.assets[0].size = MAX_DOWNLOAD_BYTES + 1;
        assert!(verified_asset(&r, &r.assets[0].browser_download_url, "v1.0").is_err());
    }
    #[test]
    fn rejects_asset_outside_the_expected_repository() {
        let mut r = release();
        r.assets[0].browser_download_url =
            "https://github.com/other/repo/releases/download/v1/a.exe".into();
        assert!(verified_asset(&r, &r.assets[0].browser_download_url, "v1.0").is_err());
    }
}
