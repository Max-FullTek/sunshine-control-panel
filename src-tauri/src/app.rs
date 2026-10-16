use crate::proxy_server;
use crate::sunshine;
use crate::tray;
use crate::windows;
use log::{error, info, warn};
use tauri::{App, AppHandle, Manager};

/// 应用程序状态
pub struct AppState {
    #[allow(dead_code)]
    pub main_window: std::sync::Mutex<Option<tauri::Window>>,
}

/// 应用程序初始化设置
pub fn setup_application(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let agent_only = args.iter().any(|arg| arg == "--hidden");
    let explicit_minimized = args.iter().any(|arg| arg == "--minimized");
    let desktop_settings = crate::desktop_settings::load_desktop_settings_from_disk();
    let send_to_client_paths = crate::file_transfer::parse_send_to_client_args(&args);
    let is_send_to_client = !send_to_client_paths.is_empty();
    let url_contains_pin = args
        .iter()
        .find(|arg| arg.starts_with("--url="))
        .map_or(false, |arg| arg.contains("/pin"));

    let app_handle = app.handle().clone();
    windows::register_agent_restart();
    crate::desktop_settings::apply_startup_settings(&app_handle, &desktop_settings);
    // 更新偏好属于应用级状态，必须在 `--hidden` 的纯托盘代理模式下也立即注册。
    // 自动联网检查仍在后面按窗口启动模式决定，避免把状态初始化和网络行为耦合。
    #[cfg(target_os = "windows")]
    crate::vdd::start_hardware_cursor_migration();
    let start_minimized = explicit_minimized || desktop_settings.start_minimized;

    // Agent-only startup keeps tray and session services alive without
    // allocating a hidden WebView. UI windows are created on demand.
    if agent_only {
        info!("Starting Sunshine user agent without WebView windows");
    } else if !url_contains_pin && !is_send_to_client {
        if start_minimized {
            windows::create_main_window_hidden(&app_handle)?;
        } else {
            windows::create_main_window(&app_handle)?;
        }
    }

    tray::create_system_tray(&app_handle)?;
    crate::power::refresh_ecoqos_state(&app_handle);
    #[cfg(target_os = "windows")]
    if let Err(e) = crate::shell_context_menu::install_file_transfer_menu() {
        warn!("⚠️  安装文件传输右键菜单失败: {}", e);
    }
    crate::nr_overlay::initialize(&app_handle);

    // 剪贴板同步：用户会话 agent 默认随面板启动；服务端如果禁用了则 SSE 自然失败，
    // 不需要额外开关。
    crate::clipboard::auto_start();
    if is_send_to_client {
        crate::file_transfer::dispatch_cli_send(send_to_client_paths);
    }

    // 启动 WebView 心跳监控（检测渲染进程崩溃并自动恢复）
    windows::start_heartbeat_monitor(app.handle().clone());

    // 延迟任务
    tauri::async_runtime::spawn(async move {
        // PIN 配对窗口
        if url_contains_pin {
            info!("🔐 将在应用启动后打开 PIN 配对窗口");
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            if let Err(e) = windows::open_pin_window(&app_handle) {
                error!("❌ 创建 PIN 配对窗口失败: {}", e);
            }
        }
    });

    Ok(())
}

pub fn shutdown_application() {
    crate::clipboard::stop();
    #[cfg(target_os = "windows")]
    crate::text_context::stop();
    #[cfg(target_os = "windows")]
    crate::tray::cleanup_prevent_sleep();
    crate::windows::unregister_agent_restart();
}

/// 处理单实例逻辑
pub fn handle_single_instance(app: &AppHandle, args: Vec<String>) {
    info!("🔔 检测到第二个实例启动，激活现有窗口");
    info!("   启动参数: {:?}", args);

    let send_to_client_paths = crate::file_transfer::parse_send_to_client_args(&args);
    if !send_to_client_paths.is_empty() {
        info!("📤 检测到文件传输右键菜单请求");
        crate::file_transfer::dispatch_cli_send(send_to_client_paths);
        return;
    }

    // 诊断：列出当前所有窗口

    if args.iter().any(|arg| arg == "--hidden") {
        info!("User agent is already running; ignoring duplicate hidden startup");
        return;
    }

    let windows: Vec<_> = app.webview_windows().keys().cloned().collect();
    info!("📋 当前存在的窗口: {:?}", windows);

    // 检查是否要打开桌面 UI
    if args.iter().any(|arg| arg == "--desktop" || arg == "-d") {
        // Legacy --desktop links now open the single configuration window.
        windows::activate_main_window(app, None);
        return;
    }

    // 提取 URL 参数并激活主窗口
    let target_url = args
        .iter()
        .find(|arg| arg.starts_with("--url="))
        .map(|arg| arg.trim_start_matches("--url=").to_string());

    if let Some(url) = &target_url {
        info!("📍 检测到 URL 参数: {}", url);

        // 检测 URL 中是否包含 /pin 路径
        match sunshine::set_runtime_sunshine_url(url) {
            Ok(base_url) => {
                proxy_server::set_sunshine_target(base_url);
                proxy_server::reset_fast_fail();
            }
            Err(e) => warn!("Invalid Sunshine URL from second instance: {}", e),
        }

        if url.contains("/pin") {
            info!("🔐 检测到 /pin 路径，打开 PIN 配对窗口");
            if let Err(e) = windows::open_pin_window(app) {
                error!("❌ 打开 PIN 窗口失败: {}", e);
            }
            return;
        }
    }

    if app.get_webview_window("main").is_none() {
        if let Err(e) = windows::create_main_window(app) {
            error!("Failed to create main panel for second instance: {}", e);
            return;
        }
    }
    windows::activate_main_window(app, target_url);
}
