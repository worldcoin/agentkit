# QA Test Plan

This is the living QA plan for this repository. Update it on every task execution and when merged changes introduce or modify behavior.

## Active Checklist

| ID | Area | Scenario | Expected | Run in this task | Last result |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Home page load | Open `http://localhost:3000` in browser | Page renders without runtime error | yes | pass |
| QA-002 | Navigation flow | From `/register`, click `Status` in nav and open `/status` | `Claim Status` heading and `Check` form controls are visible | yes | pass |
| QA-003 | Skills documentation | Verify new workflow skill files exist under `.cursor/skills/` | All 3 skill files are present and readable | yes | pass |

## Update Rules

- Add at least one new item for each behavior change.
- Mark each item run result as `pass`, `fail`, or `not-run`.
- Remove or update obsolete items when behavior is removed.
