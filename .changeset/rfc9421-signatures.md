---
'@worldcoin/agentkit-core': minor
'@worldcoin/agentkit': minor
'@worldcoin/agentkit-cli': minor
---

Replace the bare EIP-191 body signature with RFC 9421 HTTP Message Signatures. Requests are now signed under a closed profile covering `@method`, `@authority`, `@path`, `@query`, and `content-digest` (RFC 9530), with `created`/`expires`/`keyid` parameters, transported in the standard `Signature-Input`, `Signature`, and `Content-Digest` headers instead of `X-AgentKit`. The CLI's `prove` command now takes `<method> <url> [body]` and returns the three header values, and `verify` enforces the five-minute validity window and keyid binding.
