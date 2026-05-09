#!/usr/bin/env bash
# Ad-hoc code-sign the agentkit binary on macOS.
#
# Why: macOS Keychain trust ("Always Allow") is bound to a binary's code-signing
# identity. Without an explicit signature, every cargo rebuild produces a binary
# the Keychain treats as new and re-prompts for the user's password. Ad-hoc
# signing (-) gives the binary an identity; for trust that survives rebuilds,
# create a self-signed code-signing certificate in Keychain Access and pass its
# name via AGENTKIT_SIGN_IDENTITY.
#
# Run after `cargo build`. Pass `release` as the first argument to sign the
# release build instead of debug.

set -euo pipefail

profile="${1:-debug}"
identity="${AGENTKIT_SIGN_IDENTITY:--}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
binary="${script_dir}/../../target/${profile}/agentkit"

if [[ ! -f "${binary}" ]]; then
	echo "error: ${binary} not found; run 'cargo build' (or 'cargo build --release' for the release profile) first" >&2
	exit 1
fi

codesign --force --sign "${identity}" "${binary}"
echo "signed ${binary} with identity '${identity}'"
