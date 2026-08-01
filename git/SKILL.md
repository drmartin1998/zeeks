---
name: git
description: >
  Execute common Git operations safely and consistently. Handles commits,
  branches, status, push/pull, logs, and diff with automatic safety checks.
---

# Git

Execute Git operations from the project root with safety-first defaults.

## When to Use

Invoke this skill when the user asks to:

- Commit changes (`commit`, `git commit`)
- Check repository status (`status`, `git status`, "what changed?")
- Push or pull from remote (`push`, `pull`, `git push`, `sync`)
- Manage branches (`branch`, `checkout`, `switch`, "new branch")
- View history (`log`, `git log`, "what was changed?")
- View diffs (`diff`, `git diff`, "show me the changes")
- Stage files (`add`, `git add`, `stage`)

## Pre-Execution Safety Checks

Before any destructive operation (commit, push, force-push, rebase, reset):

1. Run `git status --porcelain` to understand current state
2. Run `git branch --show-current` to confirm branch
3. If uncommitted changes exist and the operation would lose them, WARN the user
4. NEVER force-push (`--force`) or hard-reset without explicit user confirmation

## Instructions

### Commit

When the user asks to commit:

1. Run `git status --porcelain` and `git diff --stat` to show what changed
2. Run `git diff --cached --stat` to show staged changes
3. If no files are staged, offer to `git add` all changed files with `git add -A`
4. Use `git commit -m "<message>"` (NOT `--no-verify` unless explicitly asked)
5. After commit, show the commit SHA and summary with `git log -1 --oneline`

**Commit message conventions:**
- Use conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
- Keep subject line under 72 characters
- Use present tense, imperative mood ("add" not "added")
- If user provides a full message, use it as-is

### Status

When the user asks for status:

1. Run `git status` (full output, not just porcelain)
2. Run `git branch -vv` to show branch tracking info
3. If behind/ahead of remote, display counts

### Push / Pull

- **Push**: `git push` (no force). Show result.
- **Pull**: `git pull --rebase` (preferred over merge). If conflicts, pause and explain.
- **Sync**: Run `git pull --rebase && git push` in sequence.

### Branch

- **List**: `git branch -a`
- **Create**: `git checkout -b <name>`
- **Switch**: `git checkout <name>` or `git switch <name>`
- **Delete**: `git branch -d <name>` (safe, won't delete unmerged). Use `-D` only with explicit confirmation.
- **Rename**: `git branch -m <old> <new>`

### Log

- **Recent**: `git log --oneline -20`
- **With graph**: `git log --oneline --graph --all -30`
- **For a file**: `git log --oneline -- <path>`

### Diff

- **Unstaged changes**: `git diff`
- **Staged changes**: `git diff --cached`
- **Specific file**: `git diff -- <path>`

## Common Patterns

### Safe commit workflow

```bash
git status --porcelain
git diff --stat
git add -A
git commit -m "feat: add user authentication"
git log -1 --oneline
```

### Sync with remote

```bash
git pull --rebase
git push
```

### Create and push a new branch

```bash
git checkout -b feat/new-feature
git push -u origin feat/new-feature
```

## Error Recovery

| Error | Resolution |
|-------|-----------|
| Merge conflict on pull | Show conflicted files with `git diff --name-only --diff-filter=U`. Guide user to resolve or `git merge --abort`. |
| Push rejected (behind remote) | Run `git pull --rebase` first, then push again. |
| Detached HEAD | Warn user immediately. Show current commit. Suggest `git checkout <branch>` to reattach. |
| Commit --amend on pushed commit | WARN: this rewrites shared history. Offer `--force-with-lease` as safer alternative. |

## Anti-Patterns (NEVER DO)

- `git push --force` without explicit user confirmation
- `git reset --hard` without explicit user confirmation
- `git commit --no-verify` unless user specifically asks to skip hooks
- `git add .` on large repos; prefer `git add -A` which respects `.gitignore`
- Amending commits that have already been pushed without warning the user
- Committing directly to `main` — always use feature branches (see constitution § Branching Strategy)

