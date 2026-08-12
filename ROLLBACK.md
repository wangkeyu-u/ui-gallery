# Rollback guide

This migration is isolated from the repository's original default branch.

- Original remote: `https://github.com/wangkeyu-u/ui-gallery.git`
- Original default branch: `main`
- Original HEAD: `ee1bf47698f22772429ab3cbaa8a1d9dea7c35d8`
- Migration branch: `codex/interview-alignment`

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

## Remove the migration branch (optional)

Only after switching away from it and confirming that none of its work is needed:

```bash
git switch main
git branch -D codex/interview-alignment
```

Deleting the local branch is intentionally not performed automatically.
