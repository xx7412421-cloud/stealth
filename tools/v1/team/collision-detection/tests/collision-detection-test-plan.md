# Collision Detection Test Plan

## Goal

Give reviewers deterministic cases for the isolated Collision Detection tool
before a production implementation is connected.

## Fixture Contract

Use `fixtures/collision-cases.json`. Each case includes:

- `existingDraft`: the current reply already present in the review batch.
- `candidateDraft`: the reply being evaluated.
- `expected.classification`: `duplicate`, `possible_duplicate`, `distinct`, or
  `invalid`.
- `expected.action`: `block`, `review`, or `allow`.

## Manual Review Cases

| Case | Expected classification | Expected action | Why it matters |
| --- | --- | --- | --- |
| `exact-whitespace-duplicate` | `duplicate` | `block` | Normalization should avoid repeated sends caused by spacing changes. |
| `near-duplicate-summary` | `possible_duplicate` | `review` | The tool should avoid overblocking shortened but similar team replies. |
| `different-recipient-distinct-body` | `distinct` | `allow` | Same subject alone is not enough to block a draft. |
| `missing-candidate-body` | `invalid` | `block` | Empty content should not be treated as a valid outgoing response. |

## Future Automated Test Shape

When a service module exists, add a folder-local test such as:

```text
tests/collision-detection.test.ts
```

The test should load the fixture cases, run the detector, and compare each
result to `expected.classification` and `expected.action`.

## Acceptance Notes

- Tests must stay inside this folder.
- Fixtures must not contain live mailbox data.
- The tool should not contact external services during local validation.
- Any future integration with the main mail app should be handled in a separate
  issue.
