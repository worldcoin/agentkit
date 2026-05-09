use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, anyhow};
use secrecy::zeroize::Zeroizing;
use secrecy::{ExposeSecret, SecretSlice};
use serde::{Deserialize, Serialize};

const KEYRING_SERVICE: &str = "org.world.agentkit";
const KEYRING_ACCOUNT: &str = "default";
const FILE_NAME: &str = "key";

/// Selects which secure storage backend the client uses to persist its identity key.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Backend {
	/// Delegates to the platform's native credential store (Keychain on macOS, Secret
	/// Service on Linux, Credential Manager on Windows) and is the recommended choice.
	Keyring,
	/// Writes the key to a permission-restricted file in the application data directory
	/// as a fallback for environments without a usable keyring.
	File,
}

impl Backend {
	/// Returns a short human-readable name for this backend, suitable for CLI output.
	pub fn label(self) -> &'static str {
		match self {
			Self::Keyring => "system keychain",
			Self::File => "file",
		}
	}
}

/// Backend-agnostic interface for persisting a single secret tied to one `AgentKit` instance.
pub trait SecretStore {
	/// Writes a secret to the store. Takes the secret by value so the
	/// in-memory buffer is wiped as soon as the call returns.
	fn write(&self, secret: SecretSlice<u8>) -> Result<()>;
	fn read(&self) -> Result<Option<SecretSlice<u8>>>;
	fn location(&self) -> String;
}

/// Constructs the [`SecretStore`] implementation for `backend`, rooted at `data_dir` for
/// filesystem-based backends.
pub fn open(backend: Backend, data_dir: &Path) -> Result<Box<dyn SecretStore>> {
	match backend {
		Backend::Keyring => Ok(Box::new(KeyringStore::new()?)),
		Backend::File => Ok(Box::new(FileStore::new(data_dir.join(FILE_NAME)))),
	}
}

/// Stores the secret in the platform's native credential store via the `keyring` crate.
pub struct KeyringStore {
	entry: keyring::Entry,
}

impl KeyringStore {
	/// Opens (or creates on first write) the keyring entry in the OS-store (e.g. Apple Keychain).
	pub fn new() -> Result<Self> {
		let entry =
			keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).context("failed to construct keyring entry")?;
		Ok(Self { entry })
	}
}

impl SecretStore for KeyringStore {
	fn write(&self, secret: SecretSlice<u8>) -> Result<()> {
		self.entry
			.set_secret(secret.expose_secret())
			.context("failed to write secret to system keychain")
	}

	fn read(&self) -> Result<Option<SecretSlice<u8>>> {
		match self.entry.get_secret() {
			Ok(bytes) => Ok(Some(SecretSlice::from(bytes))),
			Err(keyring::Error::NoEntry) => Ok(None),
			Err(err) => Err(anyhow!(err)).context("failed to read secret from system keychain"),
		}
	}

	fn location(&self) -> String {
		format!("system keychain ({KEYRING_SERVICE}/{KEYRING_ACCOUNT})")
	}
}

/// File-based fallback that stores the secret hex-encoded at a fixed path.
///
/// On Unix, the secret file is created with mode `0600` and its parent directory with `0700`.
pub struct FileStore {
	path: PathBuf,
}

impl FileStore {
	/// Creates a `FileStore` that reads and writes the secret at `path`.
	pub fn new(path: PathBuf) -> Self {
		Self { path }
	}
}

impl SecretStore for FileStore {
	fn write(&self, secret: SecretSlice<u8>) -> Result<()> {
		if let Some(parent) = self.path.parent() {
			fs::create_dir_all(parent).with_context(|| format!("failed to create directory {}", parent.display()))?;
			set_dir_permissions(parent)?;
		}

		let mut opts = fs::OpenOptions::new();
		opts.create(true).truncate(true).write(true);
		set_file_create_mode(&mut opts);

		let mut file = opts
			.open(&self.path)
			.with_context(|| format!("failed to open {} for writing", self.path.display()))?;
		let encoded = Zeroizing::new(hex::encode(secret.expose_secret()));
		file.write_all(encoded.as_bytes())
			.with_context(|| format!("failed to write secret to {}", self.path.display()))?;
		file.sync_all().ok();

		set_file_permissions(&self.path)?;
		Ok(())
	}

	fn read(&self) -> Result<Option<SecretSlice<u8>>> {
		match fs::read_to_string(&self.path) {
			Ok(contents) => {
				let contents = Zeroizing::new(contents);
				let bytes = hex::decode(contents.trim())
					.with_context(|| format!("secret file at {} is malformed", self.path.display()))?;
				Ok(Some(SecretSlice::from(bytes)))
			}
			Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
			Err(err) => Err(err).with_context(|| format!("failed to read {}", self.path.display())),
		}
	}

	fn location(&self) -> String {
		format!("file ({})", self.path.display())
	}
}

#[cfg(unix)]
fn set_file_create_mode(opts: &mut fs::OpenOptions) {
	use std::os::unix::fs::OpenOptionsExt;
	opts.mode(0o600);
}

#[cfg(not(unix))]
fn set_file_create_mode(_opts: &mut fs::OpenOptions) {}

#[cfg(unix)]
fn set_file_permissions(path: &Path) -> Result<()> {
	use std::os::unix::fs::PermissionsExt;
	let perms = fs::Permissions::from_mode(0o600);
	fs::set_permissions(path, perms).with_context(|| format!("failed to set permissions on {}", path.display()))
}

#[cfg(not(unix))]
fn set_file_permissions(_path: &Path) -> Result<()> {
	Ok(())
}

#[cfg(unix)]
fn set_dir_permissions(path: &Path) -> Result<()> {
	use std::os::unix::fs::PermissionsExt;
	let perms = fs::Permissions::from_mode(0o700);
	fs::set_permissions(path, perms).with_context(|| format!("failed to set permissions on {}", path.display()))
}

#[cfg(not(unix))]
fn set_dir_permissions(_path: &Path) -> Result<()> {
	Ok(())
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
	use tempfile::TempDir;

	use super::*;

	fn file_store(dir: &TempDir) -> FileStore {
		FileStore::new(dir.path().join("nested").join(FILE_NAME))
	}

	fn make_secret(byte: u8) -> SecretSlice<u8> {
		SecretSlice::from(vec![byte; 32])
	}

	#[test]
	fn file_store_round_trips_bytes() {
		let dir = TempDir::new().unwrap();
		let store = file_store(&dir);

		store.write(make_secret(0xAB)).unwrap();
		let read = store.read().unwrap().unwrap();

		assert_eq!(read.expose_secret(), &[0xAB; 32]);
	}

	#[test]
	fn file_store_read_returns_none_when_missing() {
		let dir = TempDir::new().unwrap();
		let store = file_store(&dir);

		assert!(store.read().unwrap().is_none());
	}

	#[test]
	fn file_store_overwrites_existing_secret() {
		let dir = TempDir::new().unwrap();
		let store = file_store(&dir);

		store.write(make_secret(1)).unwrap();
		store.write(make_secret(2)).unwrap();

		assert_eq!(store.read().unwrap().unwrap().expose_secret(), &[2; 32]);
	}

	#[test]
	fn file_store_rejects_malformed_contents() {
		let dir = TempDir::new().unwrap();
		let path = dir.path().join(FILE_NAME);
		fs::write(&path, "not hex!").unwrap();

		assert!(FileStore::new(path).read().is_err());
	}

	#[cfg(unix)]
	#[test]
	fn file_store_sets_unix_permissions() {
		use std::os::unix::fs::PermissionsExt;

		let dir = TempDir::new().unwrap();
		let store = file_store(&dir);
		store.write(make_secret(0)).unwrap();

		let file_mode = fs::metadata(dir.path().join("nested").join(FILE_NAME))
			.unwrap()
			.permissions()
			.mode() & 0o777;
		let dir_mode = fs::metadata(dir.path().join("nested")).unwrap().permissions().mode() & 0o777;

		assert_eq!(file_mode, 0o600);
		assert_eq!(dir_mode, 0o700);
	}

	#[test]
	fn backend_serializes_as_snake_case() {
		assert_eq!(serde_json::to_string(&Backend::Keyring).unwrap(), "\"keyring\"");
		assert_eq!(serde_json::to_string(&Backend::File).unwrap(), "\"file\"");
		assert_eq!(
			serde_json::from_str::<Backend>("\"keyring\"").unwrap(),
			Backend::Keyring
		);
		assert_eq!(serde_json::from_str::<Backend>("\"file\"").unwrap(), Backend::File);
	}
}
