# Email Translator Review Notes

## Scope Confirmation

This change is intentionally limited to documentation, test planning, and local
fixtures for:

```text
tools/v2/individual/email-translator/
```

It does not mount UI, call a translation provider, touch the inbox architecture,
change routing, modify wallet or Stellar code, or add production data.

## What To Review

1. `README.md` gives setup, scope, and limitation notes.
2. `specs.md` defines the future input/output contract and state model.
3. `tests/test-plan.md` provides manual checks and future automated cases.
4. `fixtures/translation-cases.json` gives deterministic synthetic inputs.

## Why This Helps Future Work

- Contributors can validate future core behavior against stable examples.
- Maintainers can review later code against documented boundaries.
- UI work can rely on documented idle, loading, success, and error states.
- The tool remains isolated until a future integration issue explicitly connects
  it to the main app.

## Known Non-Goals

- Implementing translation logic.
- Selecting a translation provider.
- Adding React components or hooks.
- Connecting to real email data.
- Adding global state or app-wide tests.

## Acceptance Mapping

| Issue requirement | Covered by |
| --- | --- |
| Tests or test plans live inside the tool folder | `tests/test-plan.md` |
| Documentation explains independent review | `README.md`, `docs/review-notes.md` |
| Work remains isolated from app-wide tests | Scope notes in all docs |
| Files are limited to the tool folder | All paths in this change |
| Self-contained mini-product review | Review map, fixtures, and test plan |
