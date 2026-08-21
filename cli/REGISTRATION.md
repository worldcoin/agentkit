# Register with AgentBook

AgentKit manages the agent identity and registration details for you. You only need World App on a mobile device to complete the World ID verification step.

## Install

```bash
npm install -g @worldcoin/agentkit-cli
```

You can also run the CLI without installing it globally:

```bash
npx @worldcoin/agentkit-cli register
```

## Register

Run:

```bash
agentkit register
```

The CLI will:

1. Create a local identity if one does not already exist.
2. Check whether that identity is already registered.
3. If needed, show a World App QR code and link.
4. Wait for World ID verification.
5. Submit the registration through the hosted relay.

If the identity is already registered, the command exits successfully without asking for World ID verification or contacting the registration relay.

## Local identity

The identity's private key is stored at `$XDG_CONFIG_HOME/agentkit/key`. If `XDG_CONFIG_HOME` is unset, empty, or relative, the path is `~/.config/agentkit/key`.

The CLI creates the key with owner-only permissions. Do not share, delete, or replace this file: doing so would change the agent's identity. Back it up using the same care you would use for any application credential.

The private key is never sent over the network. The CLI derives a public address from it and sends that address plus the World ID registration proof to the hosted relay when registration is required.

## Troubleshooting

### Identity setup failed

Make sure the configured directory is writable. If a key already exists, ensure it contains the original valid AgentKit key. The CLI will not replace a malformed key automatically because replacing it would change the agent identity.

### Verification timed out

Run `agentkit register` again and complete the World App step within five minutes. The same local identity will be reused.

### Registration lookup or submission failed

Check the network connection and retry. The command checks registration before starting a new verification, so it is safe to rerun after an uncertain response.

## Sign an x402 request

After registration, pass the HTTP method, full URL, and exact UTF-8 request body to `prove`:

```bash
agentkit prove POST 'https://api.example.com/data' '<exact-request-body>'
```

Omit the body argument for a request with no body. The command does not create a missing key and will not sign for an unregistered identity. On success, copy the returned `Content-Digest`, `Signature-Input`, and `Signature` header values onto the retry unmodified, and send it with the exact same method, URL, and body. Signed headers expire after five minutes — run `prove` again for each request.
