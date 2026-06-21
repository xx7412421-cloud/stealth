# Collision Detection

This folder is the isolated workspace for the Collision Detection tool. The
tool helps a team review outbound mail candidates and spot responses that look
like duplicates before they are sent.

## Ownership Boundary

All work for this tool must stay inside:

```text
tools/v1/team/collision-detection/
```

Do not wire this tool into the main app, routing, inbox architecture, wallet
core, Stellar core, database schema, or existing design system unless a future
integration issue explicitly allows it.

## Review Setup

This issue does not add a production integration. Review it as a folder-local
test and documentation surface:

1. Read `fixtures/collision-cases.json` for the sample duplicate-response cases.
2. Read `tests/collision-detection-test-plan.md` for expected outcomes and edge
   cases.
3. Read `docs/validation-notes.md` for independent review guidance and known
   limitations.

## Expected Behavior

- Exact duplicate draft bodies should be detected even when whitespace differs.
- Near duplicate drafts should be marked for human review instead of auto-send.
- Distinct drafts for different recipients should stay unblocked.
- Empty or missing draft content should be handled as invalid input in a future
  implementation.

## Files

- `specs.md` describes the isolated product scope and acceptance criteria.
- `fixtures/collision-cases.json` gives deterministic review inputs.
- `tests/collision-detection-test-plan.md` documents the folder-local cases.
- `docs/validation-notes.md` explains how maintainers can validate the change.
- `REVIEW_NOTES.md` summarizes the contribution for OSS review.
