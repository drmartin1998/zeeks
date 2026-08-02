---
description: >
  Creates a git feature branch following the spec-kit naming convention
  (<NNN>-<short-name>) and switches to it, ensuring no work happens on main.
---

# Git Feature Branch Creation

Create a new git branch for the current feature and switch to it.

## Steps

1. Run `.specify/scripts/bash/create-new-feature.sh --json --short-name "<SHORT_NAME>" <FEATURE_DESCRIPTION>` from repo root
2. Parse JSON output for `BRANCH_NAME`
3. Run `git checkout -b <BRANCH_NAME>` to create and switch
4. Report branch name

## Done When

- [ ] Git feature branch created and checked out
- [ ] Branch follows `<NNN>-<short-name>` naming convention
