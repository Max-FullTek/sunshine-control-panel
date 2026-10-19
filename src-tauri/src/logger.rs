use crate::log_store::LogStore;
use chrono::Local;
use log::{Level, LevelFilter, Log, Metadata, Record};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

/// In-memory log entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub target: Option<String>,
    pub file: Option<String>,
    pub line: Option<u32>,
}

/// Log collector state.
pub struct LogCollector {
    logs: Arc<Mutex<Vec<LogEntry>>>,
    max_logs: usize,
    store: Option<LogStore>,
    storage_error: Mutex<Option<String>>,
}

impl LogCollector {
    pub fn new(max_logs: usize) -> Self {
        let store = dirs::config_dir()
            .ok_or_else(|| "Cannot resolve user config directory".to_string())
            .and_then(|dir| {
                LogStore::new(dir.join("Sunshine GUI").join("logs")).map_err(|e| e.to_string())
            });
        Self::with_store(max_logs, store)
    }

    fn with_store(max_logs: usize, store: Result<LogStore, String>) -> Self {
        let (store, mut storage_error) = match store {
            Ok(store) => (Some(store), None),
            Err(error) => (None, Some(error)),
        };
        let mut restored = Vec::new();
        if let Some(store) = &store {
            match store.read() {
                Ok(text) => {
                    restored = text
                        .lines()
                        .filter_map(|line| serde_json::from_str::<LogEntry>(line).ok())
                        .collect()
                }
                Err(error) => storage_error = Some(error.to_string()),
            }
        }
        if restored.len() > max_logs {
            restored.drain(..restored.len() - max_logs);
        }
        Self {
            logs: Arc::new(Mutex::new(restored)),
            max_logs,
            store,
            storage_error: Mutex::new(storage_error),
        }
    }

    pub fn add_log(&self, record: &Record) {
        // Keep only the file name, not the full path.
        let file = record
            .file()
            .map(|f| f.rsplit(['/', '\\']).next().unwrap_or(f).to_string());

        let mut message = format!("{}", record.args());
        // Bound one record before serialization and memory retention.
        if message.len() > 16 * 1024 {
            let mut end = 16 * 1024;
            while !message.is_char_boundary(end) {
                end -= 1;
            }
            message.truncate(end);
            message.push_str(" [truncated]");
        }
        let entry = LogEntry {
            timestamp: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
            level: match record.level() {
                Level::Error => "error".to_string(),
                Level::Warn => "warn".to_string(),
                Level::Info => "info".to_string(),
                Level::Debug => "debug".to_string(),
                Level::Trace => "trace".to_string(),
            },
            message,
            target: Some(record.target().to_string()),
            file,
            line: record.line(),
        };

        // Append and cap the in-memory log list.
        {
            let mut logs = self.logs.lock().unwrap();
            if let Some(store) = &self.store {
                let result = serde_json::to_string(&entry)
                    .map_err(|e| e.to_string())
                    .and_then(|line| store.append(&line).map_err(|e| e.to_string()));
                *self.storage_error.lock().unwrap() = result.err();
            }
            logs.push(entry);

            if logs.len() > self.max_logs {
                logs.remove(0);
            }
        }
    }
}

/// Logger that forwards accepted records to the in-memory collector.
pub struct TauriLogger {
    collector: Arc<LogCollector>,
    inner: env_logger::Logger,
}

impl TauriLogger {
    pub fn new(collector: Arc<LogCollector>) -> Self {
        let default_log_level = "warn,tao=error,sunshine_gui=trace";
        let log_level = std::env::var("RUST_LOG").unwrap_or_else(|_| default_log_level.to_string());

        let mut builder =
            env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(&log_level));
        builder.format_timestamp_secs();
        builder.format_module_path(false);
        builder.format_target(false);

        Self {
            collector,
            inner: builder.build(),
        }
    }
}

impl Log for TauriLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        self.inner.enabled(metadata)
            && record_level_to_u8(metadata.level()) <= LOG_LEVEL_FILTER.load(Ordering::Relaxed)
    }

    fn log(&self, record: &Record) {
        if !self.enabled(record.metadata()) {
            return;
        }
        // env_logger is used only for filtering; records are stored by LogCollector.
        self.collector.add_log(record);
    }

    fn flush(&self) {
        // Nothing to flush.
    }
}

static LOG_COLLECTOR: once_cell::sync::OnceCell<Arc<LogCollector>> =
    once_cell::sync::OnceCell::new();
static LOG_LEVEL_FILTER: AtomicU8 = AtomicU8::new(3);

fn level_to_u8(level: LevelFilter) -> u8 {
    match level {
        LevelFilter::Off => 0,
        LevelFilter::Error => 1,
        LevelFilter::Warn => 2,
        LevelFilter::Info => 3,
        LevelFilter::Debug => 4,
        LevelFilter::Trace => 5,
    }
}

fn level_from_str(level: &str) -> LevelFilter {
    match level.trim().to_ascii_lowercase().as_str() {
        "error" => LevelFilter::Error,
        "warn" => LevelFilter::Warn,
        "debug" => LevelFilter::Debug,
        "trace" => LevelFilter::Trace,
        _ => LevelFilter::Info,
    }
}

fn record_level_to_u8(level: Level) -> u8 {
    match level {
        Level::Error => 1,
        Level::Warn => 2,
        Level::Info => 3,
        Level::Debug => 4,
        Level::Trace => 5,
    }
}

pub fn set_log_level(level: &str) {
    LOG_LEVEL_FILTER.store(level_to_u8(level_from_str(level)), Ordering::Relaxed);
}

/// Initialize logging.
pub fn init_logger(_app: AppHandle) {
    let collector = Arc::new(LogCollector::new(10000));
    let settings = crate::desktop_settings::load_desktop_settings_from_disk();
    set_log_level(&settings.log_level);

    LOG_COLLECTOR.set(collector.clone()).ok();

    let logger = Box::new(TauriLogger::new(collector));

    log::set_logger(Box::leak(logger))
        .map(|()| log::set_max_level(log::LevelFilter::Trace))
        .expect("Failed to initialize logger");
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopLogSnapshot {
    entries: Vec<LogEntry>,
    storage_path: Option<String>,
    storage_error: Option<String>,
}

#[tauri::command]
pub fn get_desktop_log_snapshot() -> Result<DesktopLogSnapshot, String> {
    let collector = LOG_COLLECTOR
        .get()
        .ok_or("Log collector is not initialized")?;
    let logs = collector.logs.lock().map_err(|e| e.to_string())?;
    Ok(DesktopLogSnapshot {
        entries: logs
            .iter()
            .skip(logs.len().saturating_sub(2000))
            .cloned()
            .collect(),
        storage_path: collector
            .store
            .as_ref()
            .map(|store| store.path.to_string_lossy().into_owned()),
        storage_error: collector
            .storage_error
            .lock()
            .map_err(|e| e.to_string())?
            .clone(),
    })
}

#[tauri::command]
pub fn get_desktop_log_archive() -> Result<String, String> {
    let collector = LOG_COLLECTOR
        .get()
        .ok_or("Log collector is not initialized")?;
    // Serialize reads with writes/rotation; neither clear nor export touches unrelated files.
    let _logs = collector.logs.lock().map_err(|e| e.to_string())?;
    collector
        .store
        .as_ref()
        .ok_or("Desktop log storage is unavailable")?
        .read()
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collector_restores_bounded_history_and_truncates_utf8_records() {
        let directory =
            std::env::temp_dir().join(format!("foundation-collector-{}", uuid::Uuid::new_v4()));
        let collector = LogCollector::with_store(2, Ok(LogStore::new(directory.clone()).unwrap()));
        for message in ["old".to_string(), "recent".to_string(), "聲".repeat(7000)] {
            collector.add_log(
                &Record::builder()
                    .args(format_args!("{message}"))
                    .level(Level::Info)
                    .file(Some(r"C:\src\app.rs"))
                    .line(Some(7))
                    .build(),
            );
        }
        let restored = LogCollector::with_store(2, Ok(LogStore::new(directory.clone()).unwrap()));
        let logs = restored.logs.lock().unwrap();
        assert_eq!(logs.len(), 2);
        assert_eq!(logs[0].message, "recent");
        assert_eq!(logs[1].file.as_deref(), Some("app.rs"));
        assert!(logs[1].message.ends_with(" [truncated]"));
        assert!(logs[1].message.len() < 16 * 1024 + 20);
        std::fs::remove_file(directory.join("desktop.jsonl")).unwrap();
        std::fs::remove_dir(directory).unwrap();
    }

    #[test]
    fn unavailable_disk_keeps_live_diagnostics_and_reports_the_error() {
        let collector = LogCollector::with_store(2, Err("fixture: unavailable storage".into()));
        collector.add_log(
            &Record::builder()
                .args(format_args!("still available"))
                .level(Level::Warn)
                .build(),
        );
        assert_eq!(collector.logs.lock().unwrap()[0].message, "still available");
        assert_eq!(
            collector.storage_error.lock().unwrap().as_deref(),
            Some("fixture: unavailable storage")
        );
    }
}
