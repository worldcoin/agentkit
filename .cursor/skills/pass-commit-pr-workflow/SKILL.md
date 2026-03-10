---
name: pass-commit-pr-workflow
description: Enforce a pass-before-commit workflow: only commit and create a pull request after required tests pass. Use when finishing a task that is ready for git commit and PR creation.
---

# Pass, Then Commit and PR

## Goal

Standardize delivery: test first, then commit, then open PR for each completed task.

## Required Gate

Do not commit or create a PR until required tests pass for the scope.

Required checks:

1. Playwright flow test for the user-facing change.
2. Any relevant project checks requested by the task.

## Delivery Sequence

1. Run tests and record outcomes.
2. If tests fail, fix issues and rerun until green.
3. Stage only relevant files.
4. Commit with a concise message explaining intent.
5. Push branch and open PR.
6. Include test evidence in PR description.

## PR Body Minimum

- `Summary`: what changed and why
- `Test plan`: checklist with executed Playwright scenario(s)
- `Result`: pass/fail status per executed check

## Safety Rules

- Never include secrets in commits.
- Do not bypass checks unless explicitly requested by user.
- If a check cannot run locally, document the blocker in PR test plan.
