---
description: >
  Create or update a declarative Gherkin .feature file by extracting user
  stories and acceptance criteria from the feature specification.
required_context:
  - Feature specification file (spec.md)
  - Feature directory path
---

# Gherkin Feature File Sync

Create or update a canonical `.feature` file (Gherkin / declarative BDD format)
from the feature specification's user stories and acceptance criteria.

This command is automatically invoked as a **mandatory hook**:
- **after_specify** — capture acceptance criteria in declarative form immediately
  after the spec is written
- **before_implement** — ensure the `.feature` file is current before any code
  is written

## User Input

```text
$ARGUMENTS
```

## Pre-Execution Checks

1. **Locate the feature spec:**
   - Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root
   - Parse the output and extract `FEATURE_DIR` (the absolute path to the
     current feature directory)
   - If FEATURE_DIR is empty or the script fails, prompt the user to run
     `/speckit-specify` first, then abort.

2. **Locate the spec file:**
   - The specification file is at `$FEATURE_DIR/spec.md`
   - If `spec.md` does not exist, abort with a message asking the user to
     create the specification first via `/speckit-specify`.

3. **Check for existing Gherkin files:**
   - The Gherkin directory is `$FEATURE_DIR/features/`
   - If the directory does not exist, create it
   - List any existing `.feature` files in `$FEATURE_DIR/features/`
   - If a `.feature` file already exists, this is an **update** — read its
     current contents to preserve any manually added scenarios

## Outline

### 1. Parse the specification

Read `$FEATURE_DIR/spec.md` and extract:

- **Feature title**: The top-level heading (e.g. `# Feature Specification: Checkout`)
- **User stories**: Each `### User Story N - Title` section
- **Acceptance scenarios**: The `**Acceptance Scenarios:**` bullet list under
  each user story, in Given/When/Then format

### 2. Determine the Gherkin file path

- Gherkin file: `$FEATURE_DIR/features/<feature-slug>.feature`
- `<feature-slug>` is derived from the feature title:
  - Lowercase, hyphens for spaces, remove special characters
  - Example: "Checkout with Promo Codes" → `checkout-with-promo-codes.feature`

### 3. Build the Gherkin content

Use the following template to create the `.feature` file:

```gherkin
Feature: {Feature Title}
  As a {role derived from user story context}
  I want to {goal derived from user story context}
  So that {benefit derived from user story context}

  Background:
    Given the system is ready for {feature context}

  @US1_{story_slug}
  Scenario: {Scenario title from acceptance criteria}
    Given {precondition from acceptance criteria}
    When {action from acceptance criteria}
    Then {expected outcome from acceptance criteria}

  @US2_{story_slug}
  Scenario: {Scenario title from acceptance criteria}
    Given {precondition}
    When {action}
    Then {expected outcome}
```

**Mapping rules:**
- Each `### User Story N` section becomes a `@US{N}_{slug}` tag
- Each `**Acceptance Scenarios:**` numbered item becomes a `Scenario:`
- Parse the Given/When/Then structure from the acceptance scenarios
- If the spec has placeholder text (e.g. `[initial state]`, `[action]`,
  `[expected outcome]`), use the user story context to make reasonable
  assumptions and fill them in. Mark ambiguous fills with a comment:
  `# TODO: verify this assumption`

**Role/goal/benefit extraction:**
- Read the narrative text between the user story heading and the acceptance
  scenarios to extract the "As a... I want... So that..." parts
- If not explicitly stated, infer from context:
  - Look for nouns that describe the user type
  - Look for action verbs that describe the goal
  - Look for value statements that describe the benefit

### 4. Handle updates

If a `.feature` file already exists:

1. **Preserve existing scenarios** that still match current user stories
2. **Update scenarios** whose acceptance criteria have changed
3. **Add new scenarios** for new user stories
4. **Deprecate removed scenarios** by commenting them out with `# DEPRECATED:`
   rather than deleting (to maintain traceability)
5. **Preserve any hand-written scenarios** that are not in the spec but are
   present in the existing file (they represent tribal knowledge)

### 5. Write the file

- Write the Gherkin content to `$FEATURE_DIR/features/<feature-slug>.feature`
- Format with proper Gherkin indentation (2-space indent for steps)
- Ensure a trailing newline at end of file

## Validation

After writing the file, verify:

- [ ] File exists at `$FEATURE_DIR/features/<feature-slug>.feature`
- [ ] File starts with `Feature:`
- [ ] Every scenario has at minimum a `Given`, `When`, and `Then` step
- [ ] No placeholder brackets `[` `]` remain (all filled in or TODOs placed)
- [ ] Tags match user story numbers from the spec
- [ ] File is valid Gherkin syntax (parseable)

## Completion Report

Report the following to the user:

- **Action**: Created new / Updated existing
- **File**: Relative path to the `.feature` file
- **Scenarios**: Count of scenarios in the file
- **User Stories Mapped**: Which user stories were mapped
- **TODOs**: Any assumptions that need verification
- **Next Step**: Remind them the Gherkin file will be used by
  `/speckit-implement` as the acceptance criteria for implementation

## Done When

- [ ] Gherkin `.feature` file created or updated at the correct path
- [ ] Every user story from the spec has at least one corresponding scenario
- [ ] File validated as syntactically correct Gherkin
- [ ] User notified of the result with file path and scenario count
