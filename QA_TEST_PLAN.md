# QA Test Plan

This is the living QA plan for this repository. Update it on every task execution and when merged changes introduce or modify behavior.

## Active Checklist

| ID | Area | Scenario | Expected | Run in this task | Last result |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Home page load | Open `http://localhost:3000` in browser | Page renders without runtime error | yes | pass |
| QA-002 | Matrix onboarding | Wait for intro typing to finish and observe CTA | `ARE YOU A ROBOT?` button appears only after alert text is typed | yes | pass |
| QA-003 | Robot gate state | Click `ARE YOU A ROBOT?`, finish/skip onboarding, then continue in same session | Onboarding modal does not appear again unless page refresh | yes | pass |
| QA-004 | Agent verification stage | After onboarding, connect wallet and run verification challenge | Verification reaches success state only when signed proof validates and AgentBook lookup succeeds | no | not-run |
| QA-005 | Typing challenge controls | Start challenge, try to paste text into input, and type words | Paste is blocked, words are shown in batches of 10, progress/time counters update | no | not-run |
| QA-006 | Typing challenge success gate | Complete all 365 words under 60s | Claim button transitions from locked to enabled | no | not-run |
| QA-007 | Claim submission | With verified agent + passed typing challenge, click claim | Claim request succeeds and transaction link appears | no | not-run |
| QA-008 | Removed routes hard check | Open `/register`, `/status`, and `/agent-challenge` | Routes are no longer available in root app (404/not found) | yes | pass |
| QA-009 | Skills documentation | Verify workflow skill files exist under `.cursor/skills/` | Skill files are present and readable | yes | pass |
| QA-010 | API request correlation | Call `GET /api/challenge` from local app | Response includes `x-request-id` header and `requestId` JSON field with matching values | yes | pass |
| QA-011 | API error taxonomy | Trigger a failing challenge request in local env | Error response includes safe `error` text, stable `code`, and `requestId` | yes | pass |
| QA-012 | Onboarding interaction regression | Open home page, wait for CTA, click `ARE YOU A ROBOT?` | Onboarding modal appears with `Step 1` and CTA switches to `ROBOT CONFIRMED` | yes | pass |
| QA-013 | Observability docs | Open `docs/OBSERVABILITY_RUNBOOK.md` | Runbook lists key events, dashboards, alert thresholds, and triage workflow | yes | pass |
| QA-014 | Local dev startup | Run `pnpm dev` from repo root and load app URL | Next.js dev server boots successfully and responds with `200 OK` (uses next open port if `3000` is busy) | yes | pass |
| QA-015 | Preview deployment | Run `vercel deploy -y` from repo root | Vercel preview build completes and returns a reachable preview URL | yes | pass |

## Update Rules

- Add at least one new item for each behavior change.
- Mark each item run result as `pass`, `fail`, or `not-run`.
- Remove or update obsolete items when behavior is removed.
