# Gherkin Feature Files Extension

A spec-kit extension that enforces **declarative Gherkin `.feature` files**
as a mandatory artifact between specification and implementation.

## Purpose

Every feature developed in this project **MUST** have a corresponding Gherkin
feature file created **before** any implementation code is written. This ensures:

- Acceptance criteria are captured in a standard, executable format
- Implementation is validated against declarative scenarios
- Traceability from user story → acceptance criteria → test → code
- A living documentation set that grows with the project

## How It Works

The extension hooks into two points in the SDD workflow:

### 1. After Specification (`after_specify`)

Immediately after `/speckit-specify` creates the feature specification, this
extension automatically runs `/speckit-gherkin-sync` to:

1. Read the newly created `spec.md`
2. Extract user stories and acceptance scenarios
3. Generate a `.feature` file at `specs/<feature>/features/<feature>.feature`
4. Validate the Gherkin syntax

### 2. Before Implementation (`before_implement`)

Immediately before `/speckit-implement` begins coding, this extension
automatically runs `/speckit-gherkin-sync` to:

1. Re-read the latest `spec.md` (it may have been updated during planning)
2. Sync any changes into the `.feature` file
3. Preserve any hand-written scenarios

## Command

| Command | Description |
|---|---|
| `/speckit-gherkin-sync` | Create or update the Gherkin `.feature` file for the current feature |

## File Structure

```
specs/<feature>/
├── spec.md                  # Feature specification (source of truth)
└── features/
    └── <feature-slug>.feature  # Generated Gherkin feature file
```

## Gherkin Format

All feature files follow standard Gherkin syntax:

```gherkin
Feature: Feature Title
  As a <role>
  I want to <goal>
  So that <benefit>

  @US1 @story-slug @priority-p1
  Scenario: Scenario title
    Given <precondition>
    When <action>
    Then <expected outcome>
```

Tags are used to map scenarios back to user stories:
- `@US1`, `@US2`, etc. — Maps to user story numbers from the spec
- `@priority-p1`, `@priority-p2` — Priority level
- `@edge-case` — Edge case scenarios
- `@error-handling` — Error handling scenarios
