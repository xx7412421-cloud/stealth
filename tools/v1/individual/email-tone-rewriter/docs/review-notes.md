# Review Notes

## Issue coverage

Issue #352 asks for safety and performance constraints before future
integration. This change adds those constraints inside the isolated tool
folder only.

## Files added or updated

- `services/tone-guards.mjs` adds local normalization, validation, and request
  capping helpers.
- `tests/tone-guards.test.mjs` covers valid requests, invalid drafts,
  unsupported tones, large body truncation, attachment metadata limits, history
  limits, and helper determinism.
- `docs/security-performance-notes.md` documents assumptions, unsafe inputs,
  limits, and reviewer checks.
- `docs/review-notes.md` maps the change back to the issue.
- `README.md` links the new helper and test command.

## Acceptance criteria mapping

- Explicit handling for malformed input: empty drafts and unsupported tones
  return deterministic errors.
- Avoid unnecessary large-request work: body, constraints, attachments, and
  history are capped before rewrite logic would run.
- No sensitive app code modified: all files remain under the local tool folder.
- Self-contained mini-product review: helper, tests, docs, and README links are
  in one folder.

## Suggested validation

Run:

`node --test tools/v1/individual/email-tone-rewriter/tests/tone-guards.test.mjs`

The test suite uses only Node built-ins and does not require app wiring.
