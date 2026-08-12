# Rollback guide

This migration is isolated from the repository's original default branch.

- Original remote: `https://github.com/wangkeyu-u/ui-gallery.git`
- Original default branch: `main`
- Original HEAD: `ee1bf47698f22772429ab3cbaa8a1d9dea7c35d8`
- Migration branch: `codex/interview-alignment`
- Round 1 completion tag: `codex/round1-complete`
- Round 1 HEAD: `20f3c175e4be80fde9a00d633e2c847a1d19e819`

No force push or remote push is part of this work.

## Return to the untouched original branch

```bash
git switch main
git status
git rev-parse HEAD
```

The final command should print:

```text
ee1bf47698f22772429ab3cbaa8a1d9dea7c35d8
```

If the local `main` branch was changed later, create a detached recovery checkout without rewriting any branch:

```bash
git switch --detach ee1bf47698f22772429ab3cbaa8a1d9dea7c35d8
```

## Return to the completed Round 1 state only

The local annotated recovery point is `codex/round1-complete`. Verify it before use:

```bash
git rev-parse codex/round1-complete^{}
```

It must print:

```text
20f3c175e4be80fde9a00d633e2c847a1d19e819
```

Create a detached, non-destructive Round 1 checkout:

```bash
git switch --detach codex/round1-complete
```

Or create a new recovery branch without changing `main` or rewriting the current migration branch:

```bash
git switch -c codex/round1-recovery codex/round1-complete
```

## Remove the migration branch (optional)

Only after switching away from it and confirming that none of its work is needed:

```bash
git switch main
git branch -D codex/interview-alignment
```

Deleting the local branch is intentionally not performed automatically.
