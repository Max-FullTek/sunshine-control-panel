//! Bounded desktop diagnostic storage, independent of Sunshine availability.
use std::fs::{self, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::PathBuf;

pub const FILE_LIMIT: u64 = 2 * 1024 * 1024;

pub struct LogStore {
    pub path: PathBuf,
    previous: PathBuf,
    limit: u64,
}

impl LogStore {
    pub fn new(directory: PathBuf) -> io::Result<Self> {
        fs::create_dir_all(&directory)?;
        Ok(Self {
            path: directory.join("desktop.jsonl"),
            previous: directory.join("desktop.previous.jsonl"),
            limit: FILE_LIMIT,
        })
    }

    pub fn append(&self, line: &str) -> io::Result<()> {
        if line.len() as u64 + 1 > self.limit {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Log record exceeds file limit",
            ));
        }
        let (size, mut separator) = match fs::File::open(&self.path) {
            Ok(mut file) => {
                let size = file.metadata()?.len();
                let mut last = [b'\n'];
                if size > 0 {
                    file.seek(SeekFrom::End(-1))?;
                    file.read_exact(&mut last)?;
                }
                (size, last[0] != b'\n')
            }
            Err(error) if error.kind() == io::ErrorKind::NotFound => (0, false),
            Err(error) => return Err(error),
        };
        if size + line.len() as u64 + 1 + u64::from(separator) > self.limit {
            match fs::remove_file(&self.previous) {
                Ok(()) => {}
                Err(error) if error.kind() == io::ErrorKind::NotFound => {}
                Err(error) => return Err(error),
            }
            if self.path.exists() {
                fs::rename(&self.path, &self.previous)?;
            }
            separator = false;
        }
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)?;
        if separator {
            writeln!(file)?;
        }
        writeln!(file, "{line}")
    }

    pub fn read(&self) -> io::Result<String> {
        let mut output = String::new();
        for path in [&self.previous, &self.path] {
            match fs::File::open(path) {
                Ok(file) => {
                    let mut bytes = Vec::new();
                    file.take(self.limit).read_to_end(&mut bytes)?;
                    output.push_str(&String::from_utf8_lossy(&bytes));
                    if !output.ends_with('\n') {
                        output.push('\n');
                    }
                }
                Err(error) if error.kind() == io::ErrorKind::NotFound => {}
                Err(error) => return Err(error),
            }
        }
        Ok(output)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rotation_is_bounded_and_survives_reopening() {
        let directory =
            std::env::temp_dir().join(format!("foundation-log-test-{}", std::process::id()));
        let mut store = LogStore::new(directory.clone()).unwrap();
        store.limit = 8;
        store.append("one").unwrap();
        store.append("two").unwrap();
        store.append("three").unwrap();
        store.append("four").unwrap();
        let reopened = LogStore::new(directory.clone()).unwrap();
        assert_eq!(reopened.read().unwrap(), "three\nfour\n");
        assert!(fs::metadata(&store.path).unwrap().len() <= 8);
        assert!(fs::metadata(&store.previous).unwrap().len() <= 8);
        fs::remove_file(store.path).unwrap();
        fs::remove_file(store.previous).unwrap();
        fs::remove_dir(directory).unwrap();
    }
    #[test]
    fn interrupted_last_record_does_not_swallow_the_next_record() {
        let directory =
            std::env::temp_dir().join(format!("foundation-log-partial-{}", std::process::id()));
        let store = LogStore::new(directory.clone()).unwrap();
        fs::write(&store.path, "partial").unwrap();
        store.append("next").unwrap();
        assert_eq!(store.read().unwrap(), "partial\nnext\n");
        fs::remove_file(store.path).unwrap();
        fs::remove_dir(directory).unwrap();
    }

    #[test]
    fn oversized_record_cannot_exceed_retention_limit() {
        let directory =
            std::env::temp_dir().join(format!("foundation-log-limit-{}", std::process::id()));
        let mut store = LogStore::new(directory.clone()).unwrap();
        store.limit = 8;
        assert_eq!(
            store.append("oversized").unwrap_err().kind(),
            io::ErrorKind::InvalidInput
        );
        assert_eq!(store.read().unwrap(), "");
        fs::remove_dir(directory).unwrap();
    }
}
