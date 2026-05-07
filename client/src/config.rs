use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, anyhow};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

use crate::storage::Backend;

const CONFIG_FILE: &str = "config.json";

/// Persistent user preferences for the `AgentKit` client, serialized as JSON in the application
/// data directory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
	pub backend: Backend,
}

impl Config {
	/// Reads the config from disk, returning `Ok(None)` when no config has been saved yet.
	pub fn load(paths: &Paths) -> Result<Option<Self>> {
		let path = paths.config_path();
		match fs::read_to_string(&path) {
			Ok(contents) => {
				let cfg: Self = serde_json::from_str(&contents)
					.with_context(|| format!("failed to parse config at {}", path.display()))?;
				Ok(Some(cfg))
			}
			Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
			Err(err) => Err(err).with_context(|| format!("failed to read config at {}", path.display())),
		}
	}

	/// Writes the config to disk, creating the application data directory if it does not exist.
	pub fn save(&self, paths: &Paths) -> Result<()> {
		ensure_dir(&paths.data_dir)?;
		let path = paths.config_path();
		let contents = serde_json::to_string_pretty(self).context("failed to serialize config")?;
		fs::write(&path, contents).with_context(|| format!("failed to write config to {}", path.display()))?;
		Ok(())
	}
}

/// Resolved filesystem locations the `AgentKit` client uses for configuration and storage.
pub struct Paths {
	pub data_dir: PathBuf,
}

impl Paths {
	/// Resolves the platform-appropriate application data directory (e.g.
	/// `~/Library/Application Support/org.world.agentkit` on macOS).
	pub fn discover() -> Result<Self> {
		let project = ProjectDirs::from("org", "world", "agentkit")
			.ok_or_else(|| anyhow!("could not determine application data directory for this platform"))?;
		Ok(Self {
			data_dir: project.data_dir().to_path_buf(),
		})
	}

	/// Returns the absolute path to the JSON config file inside the data directory.
	pub fn config_path(&self) -> PathBuf {
		self.data_dir.join(CONFIG_FILE)
	}
}

fn ensure_dir(dir: &Path) -> Result<()> {
	fs::create_dir_all(dir).with_context(|| format!("failed to create directory {}", dir.display()))
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
	use tempfile::TempDir;

	use super::*;

	fn paths_in(dir: &TempDir) -> Paths {
		Paths {
			data_dir: dir.path().join("data"),
		}
	}

	#[test]
	fn load_returns_none_when_missing() {
		let dir = TempDir::new().unwrap();
		assert!(Config::load(&paths_in(&dir)).unwrap().is_none());
	}

	#[test]
	fn save_then_load_round_trips() {
		let dir = TempDir::new().unwrap();
		let paths = paths_in(&dir);

		Config { backend: Backend::File }.save(&paths).unwrap();
		let loaded = Config::load(&paths).unwrap().unwrap();

		assert_eq!(loaded.backend, Backend::File);
		assert!(paths.config_path().exists());
	}

	#[test]
	fn save_creates_data_dir() {
		let dir = TempDir::new().unwrap();
		let paths = paths_in(&dir);
		assert!(!paths.data_dir.exists());

		Config {
			backend: Backend::Keyring,
		}
		.save(&paths)
		.unwrap();

		assert!(paths.data_dir.is_dir());
	}

	#[test]
	fn load_errors_on_malformed_json() {
		let dir = TempDir::new().unwrap();
		let paths = paths_in(&dir);
		fs::create_dir_all(&paths.data_dir).unwrap();
		fs::write(paths.config_path(), "{not valid json").unwrap();

		assert!(Config::load(&paths).is_err());
	}
}
