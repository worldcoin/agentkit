---
name: playwright-test-after-task
description: Require Playwright validation after completing each implementation task. Use when finishing a coding task, bug fix, or refactor so the app is tested in a real browser before reporting completion.
---

# Playwright Test After Each Task

## Goal

Ensure every completed implementation task is validated in the running app with Playwright browser automation.

## Required Workflow

1. Confirm the app is running locally (reuse an existing dev server when available).
2. Run a Playwright browser check that covers the changed user path.
3. Capture objective evidence of pass/fail (snapshot text, URL checks, or screenshot artifact).
4. Treat failing Playwright checks as blockers: fix, retest, and only then report completion.

## Minimum Playwright Coverage

- Open the app URL for the task (default `http://localhost:3000` unless project says otherwise).
- Verify the page loads and key changed UI is visible.
- Execute at least one interaction tied to the change.
- Verify the expected post-action state.

## Reporting Format

Use this short format in the final task update:

- `Playwright status`: pass or fail
- `Flow tested`: the exact user flow exercised
- `Evidence`: key assertion(s) observed
