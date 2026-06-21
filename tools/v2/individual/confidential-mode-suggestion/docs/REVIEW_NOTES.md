# Review Notes

## Issue coverage

Issue #477 asks for safety and performance constraints before future
integration. This change adds that boundary inside the isolated tool folder.

## Files added or updated

- `services/confidential-mode-guards.mjs` adds request normalization, input
  caps, privacy-signal scoring, and recommendation output.
- `tests/confidential-mode-guards.test.mjs` covers valid input, empty input,
  large input caps, attachment metadata handling, high-signal recommendations,
  and low-signal review behavior.
- `docs/SECURITY_AND_PERFORMANCE.md` documents assumptions, limits, unsafe input
  categories, and reviewer checks.
- `docs/REVIEW_NOTES.md` maps the change to issue #477.
- `README.md` links the guard helper and local test command.

## Acceptance criteria mapping

- Explicit handling for malformed or hostile input: empty requests return
  deterministic errors, and noisy strings are cleaned before scoring.
- Avoid unnecessary work on large datasets: body, recipients, attachments, and
  context are capped before recommendation scoring.
- No existing sensitive app code modified: all files stay inside the local tool
  folder.
- Self-contained mini-product review: helper, tests, docs, and README links are
  colocated.

## Suggested validation

Run:

`node --test tools/v2/individual/confidential-mode-suggestion/tests/confidential-mode-guards.test.mjs`
