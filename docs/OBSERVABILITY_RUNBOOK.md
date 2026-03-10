# Observability Runbook

This runbook defines how to debug and operate both app surfaces:

- Root app (`/app`, `/components`, `/lib`)
- `sybil-airdrop` app (`/sybil-airdrop/src/app`, `/sybil-airdrop/src/components`, `/sybil-airdrop/src/lib`)

## What Is Instrumented

- Structured JSON logs with shared fields:
  - `timestamp`, `level`, `event`, `service`, `env`, `traceId`, `spanId`, `requestId`
  - Route context (`route`, `method`, `durationMs`)
  - Safe actor context (`wallet` masked as `0x1234...abcd`)
- Sensitive value redaction:
  - `authorization`, `signature`, `token`, `privateKey`, `proof`, `payload`
- Request correlation:
  - API handlers read/generate `x-request-id`
  - Responses echo `x-request-id`
  - JSON responses include `requestId`
- Error taxonomy:
  - `BAD_REQUEST`, `NONCE_INVALID`, `NONCE_EXPIRED`, `INVALID_SIGNATURE`
  - `AGENT_NOT_REGISTERED`, `CLAIM_ALREADY_EXISTS`
  - `DB_READ_FAILED`, `DB_WRITE_FAILED`, `CHAIN_TX_FAILED`
  - `CHALLENGE_NOT_FOUND`, `CHALLENGE_USED`, `DETERMINISTIC_PAYLOAD_MISMATCH`
  - `RP_CONTEXT_FAILED`, `INTERNAL_ERROR`
- OpenTelemetry tracing primitives:
  - `withSpan(...)` wrappers around challenge creation, signature verification, AgentBook lookup, DB reads/writes, and claim execution.

## Key Log Events

- Claim flow:
  - `claim.request.start`
  - `claim.validation.failed`
  - `claim.signature.invalid`
  - `claim.agent_not_registered`
  - `claim.already_exists`
  - `claim.insert.failed`
  - `claim.request.success`
  - `claim.request.failed`
- Challenge flow:
  - `challenge.request.start`
  - `challenge.insert.failed`
  - `challenge.request.success`
  - `challenge.request.failed`
- Agent challenge flow:
  - `agent_challenge.issue.start`
  - `agent_challenge.issue.success`
  - `agent_challenge.verify.start`
  - `agent_challenge.verify.success`
  - `agent_challenge.verify.failed`
- Sybil status + RP context:
  - `status.request.start`
  - `status.request.success`
  - `status.request.failed`
  - `rp_context.request.start`
  - `rp_context.request.success`
  - `rp_context.request.failed`

## Baseline Dashboards

Create dashboards grouped by `service` and `route`.

1) Error rate by route and code
- Filter: `level=error OR code exists`
- Group by: `service`, `route`, `code`
- Window: 5m and 1h

2) Latency by endpoint
- Filter: `event in (claim.request.success, challenge.request.success, status.request.success, rp_context.request.success)`
- Metric: `p50`, `p95`, `p99` of `durationMs`
- Group by: `route`

3) Claim funnel health
- Sequence counts:
  - `challenge.request.success`
  - `claim.request.start`
  - `claim.request.success`
- Drop-off metric:
  - `(claim.request.start - claim.request.success) / claim.request.start`

4) Abuse and verification anomalies
- Track count over time for:
  - `code=NONCE_INVALID`
  - `code=NONCE_EXPIRED`
  - `code=INVALID_SIGNATURE`
  - `code=CHALLENGE_USED`
  - `event=agent_challenge.verify.failed`

## Alert Thresholds

Use rolling 5-minute windows unless otherwise stated.

- Critical: claim failures
  - Trigger when `claim.request.failed` > 5 within 5m
  - Trigger when `claim.request.success` drops to 0 for 10m while `claim.request.start` > 10
- High: latency regressions
  - Trigger when p95 `durationMs` for `/api/claim` > 4000ms for 10m
  - Trigger when p95 `durationMs` for `/api/challenge` > 1000ms for 10m
- Medium: signature/nonce anomalies
  - Trigger when `code in (INVALID_SIGNATURE, NONCE_INVALID, NONCE_EXPIRED)` > 25 within 10m
- Medium: RP context
  - Trigger when `rp_context.request.failed` > 3 within 10m

## Incident Triage Workflow

1) Start with `requestId`
- Search logs by `requestId`.
- Reconstruct route lifecycle (`*.start -> *.success|*.failed`).

2) Correlate with tracing
- Use `traceId` and `spanId` from the same log event.
- Inspect slow/failing spans:
  - `claim.lookup_human`
  - `claim.lookup_existing`
  - `claim.execute_airdrop`
  - `claim.insert_record`

3) Classify by code
- `INVALID_SIGNATURE`: wallet signature mismatch or malformed payload.
- `NONCE_*`: stale/reused challenge or clock skew.
- `AGENT_NOT_REGISTERED`: expected for unregistered agents; investigate surge patterns.
- `DB_*`: Supabase connectivity/table policy issue.
- `CHAIN_TX_FAILED`: simulation/write contract failure, RPC instability, or signer issue.

4) Containment actions
- Increase challenge TTL only if expiry spikes are legitimate.
- Rate-limit offending wallets/IPs when signature/nonce abuse spikes.
- Disable claim CTA in UI during sustained `CHAIN_TX_FAILED` incidents.

## Client Diagnostics

- Client telemetry logs flow milestones:
  - challenge fetch started/completed
  - claim submission started/completed
  - verification/register failures
- Correlate browser-side failures with server-side traces via `x-request-id`.
- In production, client telemetry only emits `error` level to reduce noise.

## Verification Checklist

- Every API response includes:
  - `x-request-id` response header
  - `requestId` field in JSON body
- Top-level exceptions never expose stack traces in API response bodies.
- Logs do not expose raw signatures, tokens, or private keys.
