use crate::windows;
use log::info;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn toggle_dark_mode(_window: tauri::Window) -> Result<bool, String> {
    // Theme state is controlled by the frontend.
    Ok(true)
}

#[tauri::command]
pub async fn open_tool_window(app: AppHandle, tool_name: String) -> Result<(), String> {
    info!("Opening tool window: {}", tool_name);

    match tool_name.as_str() {
        "main" => {
            if let Some(window) = app.get_webview_window("main") {
                windows::show_and_activate_window(&window);
            }
        }
        "vdd" => {
            if let Some(window) = app.get_webview_window("main") {
                windows::show_and_activate_window(&window);
                let _ = window.emit("open-vdd-settings", ());
            }
        }
        "about" => {
            windows::open_about_window(&app)?;
        }
        "diagnostics" => {
            windows::open_diagnostics(&app)?;
        }
        "logs" | "log_console" => {
            windows::open_log_console(&app)?;
        }
        _ => return Err(format!("Unknown tool name: {}", tool_name)),
    }
    Ok(())
}
