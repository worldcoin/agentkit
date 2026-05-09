//! `AgentKit` Client CLI. Allows agents to interact online with a delegated Proof of Human from
//! a user's World ID.

use std::process::ExitCode;

use clap::{Parser, Subcommand};

mod config;
mod enroll;
mod storage;

#[derive(Debug, Parser)]
#[command(
	name = "agentkit",
	version,
	about = "AgentKit Client: Interface for agents + World ID through a CLI.",
	long_about = None,
)]
struct Cli {
	#[command(subcommand)]
	command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
	/// Enroll this client with the user's World ID by registering a Proving Authenticator.
	Enroll,
}

fn main() -> ExitCode {
	let cli = Cli::parse();
	let result = match cli.command {
		Command::Enroll => enroll::run(),
	};

	match result {
		Ok(()) => ExitCode::SUCCESS,
		Err(err) => {
			eprintln!("agentkit: {err:#}");
			ExitCode::from(1)
		}
	}
}
