# @worldcoin/agentkit-cli

Register an agent with a World ID-verified human through AgentBook.

## Usage

```bash
agentkit register
```

That is the entire registration command. On its first run, the CLI creates a local identity, checks whether it is already registered, and only starts World ID verification when registration is still needed. Successful registrations are submitted through the hosted relay.

The private key is stored at:

```text
$XDG_CONFIG_HOME/agentkit/key
```

When `XDG_CONFIG_HOME` is not set to an absolute path, the CLI uses:

```text
~/.config/agentkit/key
```

Keep this file private and back it up. It is the durable identity for this agent. The private key never leaves the machine; registration sends the derived public address and World ID proof to the hosted relay.

Full registration guide: [REGISTRATION.md](./REGISTRATION.md)

## Sign a request as this agent

Pass the HTTP method, the full URL, and the exact UTF-8 request body to `prove`:

```bash
agentkit prove POST 'https://api.example.com/data' '{"query":"weather","city":"Lisbon"}'
```

For a request with no body, omit the last argument:

```bash
agentkit prove GET 'https://api.example.com/data'
```

The command requires the key created by `agentkit register` and confirms that its address is registered before signing. It returns a `headers` object with three values — `Content-Digest`, `Signature-Input`, and `Signature` (RFC 9421 HTTP message signatures) — to copy onto the request unmodified.

The signature is bound to the method, host, path, query string, and body, expires after five minutes, and carries a single-use nonce. Send the request with the exact same method, URL, and byte-identical body, and run `prove` again for every new request — signed headers must never be reused.
