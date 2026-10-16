use crate::windows;
use log::{debug, error};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};

fn get_tool_window_config_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to get app data directory: {}", e))?;

    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("failed to create app data directory: {}", e))?;
    }

    Ok(app_data_dir.join("tool_window_config.json"))
}

pub fn save_tool_window_position_internal<R: Runtime>(app: &AppHandle<R>, x: f64, y: f64) {
    if let Ok(config_path) = get_tool_window_config_path(app) {
        let config = serde_json::json!({
            "x": x,
            "y": y
        });

        if let Err(e) = fs::write(&config_path, config.to_string()) {
            error!("failed to save tool window position: {}", e);
        } else {
            debug!("tool window position saved: ({}, {})", x, y);
        }
    }
}

fn load_tool_window_position<R: Runtime>(app: &AppHandle<R>) -> Option<(f64, f64)> {
    let config_path = match get_tool_window_config_path(app) {
        Ok(path) => path,
        Err(e) => {
            error!("failed to get tool window config path: {}", e);
            return None;
        }
    };

    if !config_path.exists() {
        return None;
    }

    match fs::read_to_string(&config_path) {
        Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(config) => {
                let x = config["x"].as_f64()?;
                let y = config["y"].as_f64()?;
                debug!("loaded tool window position: ({}, {})", x, y);
                Some((x, y))
            }
            Err(e) => {
                error!("failed to parse tool window config: {}", e);
                None
            }
        },
        Err(e) => {
            error!("failed to read tool window config: {}", e);
            None
        }
    }
}

#[derive(Clone, Copy, Debug)]
struct MonitorBounds {
    position: tauri::PhysicalPosition<i32>,
    size: tauri::PhysicalSize<u32>,
}

fn squared_distance_to_monitor(point: tauri::PhysicalPosition<i32>, monitor: MonitorBounds) -> i64 {
    let min_x = monitor.position.x as i64;
    let min_y = monitor.position.y as i64;
    let max_x = min_x + monitor.size.width.saturating_sub(1) as i64;
    let max_y = min_y + monitor.size.height.saturating_sub(1) as i64;
    let x = point.x as i64;
    let y = point.y as i64;
    let dx = if x < min_x {
        min_x - x
    } else if x > max_x {
        x - max_x
    } else {
        0
    };
    let dy = if y < min_y {
        min_y - y
    } else if y > max_y {
        y - max_y
    } else {
        0
    };
    dx * dx + dy * dy
}

fn monitor_index_for_position(
    position: tauri::PhysicalPosition<i32>,
    monitors: &[MonitorBounds],
) -> Option<usize> {
    monitors
        .iter()
        .enumerate()
        .min_by_key(|(_, monitor)| squared_distance_to_monitor(position, **monitor))
        .map(|(index, _)| index)
}

fn monitor_for_position<R: Runtime>(
    window: &tauri::WebviewWindow<R>,
    position: tauri::PhysicalPosition<i32>,
) -> Option<tauri::Monitor> {
    let monitors = window.available_monitors().ok()?;
    let bounds = monitors
        .iter()
        .map(|monitor| MonitorBounds {
            position: *monitor.position(),
            size: *monitor.size(),
        })
        .collect::<Vec<_>>();
    let index = monitor_index_for_position(position, &bounds)?;
    monitors.into_iter().nth(index)
}

// Keep persisted floating panel positions visible after display or DPI changes.
fn clamp_tool_window_position<R: Runtime>(
    window: &tauri::WebviewWindow<R>,
    position: tauri::PhysicalPosition<i32>,
    logical_width: f64,
    logical_height: f64,
) -> tauri::PhysicalPosition<i32> {
    let monitor =
        monitor_for_position(window, position).or_else(|| window.current_monitor().ok().flatten());
    match monitor {
        Some(monitor) => windows::clamp_window_position_to_monitor(
            position,
            *monitor.position(),
            *monitor.size(),
            monitor.scale_factor(),
            logical_width,
            logical_height,
            16.0,
        ),
        _ => position,
    }
}

pub fn create_tool_window_internal<R: Runtime>(
    app: &AppHandle<R>,
    tool_type: &str,
) -> Result<(), String> {
    let is_nr = tool_type == "nr";
    if is_nr {
        crate::nr_overlay::request_visibility(app, true);
    }
    let tool_window_id = if is_nr { "nr_overlay" } else { "tool_window" };
    let window_width = if is_nr { 190.0 } else { 340.0 };
    let window_height = if is_nr { 48.0 } else { 260.0 };
    let is_performance_monitor = tool_type == "performance" || is_nr;

    // 如果窗口已存在，先关闭它
    if let Some(window) = app.get_webview_window(tool_window_id) {
        if is_nr {
            return window.show().map_err(|e| e.to_string());
        }
        let _ = window.close();
    }

    // 创建工具窗口，通过 URL 参数传递工具类型
    let url = format!("tool-window/index.html?tool={}", tool_type);
    let title = format!("ZakoToolsWindow - {}", tool_type);
    debug!("🔧 创建工具窗口 URL: {}", url);

    let mut builder =
        tauri::WebviewWindowBuilder::new(app, tool_window_id, tauri::WebviewUrl::App(url.into()))
            .title(&title)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .focused(!is_nr)
            .visible(false);

    if is_performance_monitor {
        builder = builder
            .inner_size(window_width, window_height)
            .resizable(!is_nr);
        if !is_nr {
            builder = builder.min_inner_size(320.0, 180.0);
        }
    } else {
        builder = builder.fullscreen(true);
    }

    match builder.build() {
        Ok(window) => {
            // 在生产环境禁用右键菜单
            windows::disable_context_menu(&window);

            // 禁用自动填充和密码保存提示
            #[cfg(target_os = "windows")]
            windows::configure_webview_security(&window);

            crate::power::refresh_ecoqos_state(app);
            // 开发模式下自动打开 DevTools
            #[cfg(debug_assertions)]
            {
                if !is_performance_monitor {
                    window.open_devtools();
                    let _ = window.set_always_on_top(false);
                    debug!("🔧 [开发模式] 工具窗口已自动打开 DevTools");
                }
            }

            // 等待一小段时间让内容加载，然后显示窗口
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                if is_performance_monitor {
                    if let Some((x, y)) = load_tool_window_position(&window.app_handle()) {
                        let position = clamp_tool_window_position(
                            &window,
                            tauri::PhysicalPosition::new(x as i32, y as i32),
                            window_width,
                            window_height,
                        );
                        let _ = window.set_position(position);
                    } else if let Ok(Some(monitor)) = window.current_monitor() {
                        let monitor_pos = monitor.position();
                        let monitor_size = monitor.size();
                        let scale = monitor.scale_factor();
                        let margin = (16.0 * scale) as i32;
                        let width = (window_width * scale) as i32;
                        let x = monitor_pos.x + monitor_size.width as i32 - width - margin;
                        let y = monitor_pos.y + margin;
                        let position = clamp_tool_window_position(
                            &window,
                            tauri::PhysicalPosition::new(x, y),
                            window_width,
                            window_height,
                        );
                        let _ = window.set_position(position);
                    }
                }
                if !is_nr || crate::nr_overlay::visibility_requested() {
                    let _ = window.show();
                }
            });
        }
        Err(e) => {
            return Err(format!("创建工具窗口失败: {}", e));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{MonitorBounds, monitor_index_for_position};
    use tauri::{PhysicalPosition, PhysicalSize};

    #[test]
    fn selects_the_monitor_containing_a_saved_negative_position() {
        let monitors = [
            MonitorBounds {
                position: PhysicalPosition::new(0, 0),
                size: PhysicalSize::new(1920, 1080),
            },
            MonitorBounds {
                position: PhysicalPosition::new(-1280, 0),
                size: PhysicalSize::new(1280, 1024),
            },
        ];

        assert_eq!(
            monitor_index_for_position(PhysicalPosition::new(-900, 100), &monitors),
            Some(1)
        );
        assert_eq!(
            monitor_index_for_position(PhysicalPosition::new(400, 100), &monitors),
            Some(0)
        );
    }

    #[test]
    fn selects_the_nearest_monitor_after_a_display_is_removed() {
        let monitors = [
            MonitorBounds {
                position: PhysicalPosition::new(0, 0),
                size: PhysicalSize::new(1920, 1080),
            },
            MonitorBounds {
                position: PhysicalPosition::new(1920, 0),
                size: PhysicalSize::new(2560, 1440),
            },
        ];

        assert_eq!(
            monitor_index_for_position(PhysicalPosition::new(5000, 300), &monitors),
            Some(1)
        );
    }
}
