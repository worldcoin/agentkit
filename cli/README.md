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

Keep this file private. Store any backup in a secure location. It is the durable identity for this agent. The CLI does not send the private key over the network. Registration sends the derived public address and World ID proof to the hosted relay.

Full registration guide: [REGISTRATION.md](./REGISTRATION.md)

## Sign a request as this agent

Pass the exact UTF-8 request body to `prove`:

```bash
agentkit prove '{"query":"weather","city":"Lisbon"}'
```

For a request with no body, pass an empty string:

```bash
agentkit prove ''
```

The command requires the key created by `agentkit register` and confirms that its address is registered before signing. It returns a `signature` field containing the hexadecimal value for the `AgentKit` request header. The retried request body must exactly match the body passed to `prove`.
