use anyhow::{Context, Result};
use dialoguer::{Confirm, Select, theme::ColorfulTheme};
use secrecy::{ExposeSecretMut, SecretSlice};

use crate::config::{Config, Paths};
use crate::storage::{self, Backend, SecretStore};

const SEED_LEN: usize = 32;

pub fn run() -> Result<()> {
	let paths = Paths::discover()?;
	let config = resolve_config(&paths)?;
	let store = storage::open(config.backend, &paths.data_dir)?;

	if store.read()?.is_some() && !confirm_overwrite(&*store)? {
		println!("Aborted. Existing identity preserved.");
		return Ok(());
	}

	let location = store.location();
	store
		.write(generate_seed()?)
		.with_context(|| format!("failed to store identity in {location}"))?;

	println!();
	println!("AgentKit identity created.");
	println!("  Storage: {}", store.location());

	// TODO: Initiate registration with World ID
	Ok(())
}

fn resolve_config(paths: &Paths) -> Result<Config> {
	if let Some(existing) = Config::load(paths)? {
		return Ok(existing);
	}

	let backend = prompt_backend()?;
	let cfg = Config { backend };
	cfg.save(paths)?;
	println!(
		"Saved storage preference: {} ({})",
		backend.label(),
		paths.config_path().display()
	);
	Ok(cfg)
}

fn prompt_backend() -> Result<Backend> {
	let options = [
		"System keychain (recommended) — uses your OS secure storage",
		"File — stores the key on disk in the AgentKit data directory (less secure)",
	];
	let selection = Select::with_theme(&ColorfulTheme::default())
		.with_prompt("Where should AgentKit store its identity key?")
		.items(options)
		.default(0)
		.interact()
		.context("interactive prompt failed; run in a terminal or pre-configure storage")?;

	let backend = match selection {
		0 => Backend::Keyring,
		_ => Backend::File,
	};

	Ok(backend)
}

fn confirm_overwrite(store: &dyn SecretStore) -> Result<bool> {
	println!("An AgentKit identity already exists in {}.", store.location());
	Confirm::with_theme(&ColorfulTheme::default())
		.with_prompt("Overwrite the existing identity? This cannot be undone.")
		.default(false)
		.interact()
		.context("interactive prompt failed")
}

fn generate_seed() -> Result<SecretSlice<u8>> {
	let mut secret = SecretSlice::from(vec![0u8; SEED_LEN]);
	getrandom::fill(secret.expose_secret_mut()).context("failed to read randomness from the OS")?;
	Ok(secret)
}
