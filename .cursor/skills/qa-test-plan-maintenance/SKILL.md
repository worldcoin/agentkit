---
name: qa-test-plan-maintenance
description: Maintain a living QA test plan for every execution and merged code change. Use when implementing features, fixing bugs, or preparing pull requests to add or update test coverage items.
---

# QA Test Plan Maintenance

## Goal

Keep a persistent QA checklist that grows with each implementation and merge so regression coverage improves over time.

## Required Workflow

1. Find the current test plan document before coding.
2. Add test items for the current execution scope.
3. Add new regression items for behavior introduced or changed by merged work.
4. Mark execution results for each tested item (pass/fail/not-run).

## Test Item Rules

- Each item must be concrete, reproducible, and user-visible.
- Include preconditions when needed (wallet connected, authenticated, seeded data).
- Include expected outcome, not just action.
- Prefer stable, scenario-based wording over implementation details.

## Suggested Item Template

- `ID`: short unique label
- `Area`: page or feature
- `Scenario`: user action sequence
- `Expected`: observable result
- `Run in this task`: yes/no
- `Last result`: pass/fail/not-run

## Merge Hygiene

Before opening or updating a PR, verify:

- New behavior has at least one new QA item.
- Risky paths have regression items.
- Removed behavior has stale test items cleaned up.
