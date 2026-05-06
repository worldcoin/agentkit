use std::process::ExitCode;

use clap::{Parser, Subcommand};

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
	let name = match cli.command {
		Command::Enroll => "enroll",
	};
	eprintln!("agentkit: `{name}` is not yet implemented (WIP-512 scaffold).");
	ExitCode::from(1)
}
