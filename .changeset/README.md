# Changesets

Every PR that changes a published package should include a changeset. Create one with:

```bash
bun run changeset
```

## Version linkage

- `@worldcoin/agentkit-core` and `@worldcoin/agentkit` are `fixed` — they always share a version number. Bumping one automatically bumps the other.
- `@worldcoin/agentkit-cli` versions independently.

## Releasing

Releases are automated by `.github/workflows/release.yml`. When a commit lands on `main` with one or more changesets, the workflow opens a "Version Packages" PR that bumps versions and updates changelogs. Merging that PR triggers `bun release` → `changeset publish`, which publishes to npm using trusted publishing (OIDC).

No local `bun publish` is needed.
