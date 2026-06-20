# Email Translator Test Plan

## Goal

This plan defines how contributors can review the Email Translator tool before
the core translation engine is implemented. It keeps testing local to
`tools/v2/individual/email-translator/`.

## Manual Review Checklist

- Confirm all changed files are inside this folder.
- Confirm no live translation provider, network request, secret, wallet value,
  or production email data is introduced.
- Confirm `fixtures/translation-cases.json` contains only synthetic examples.
- Confirm `README.md` explains the current limitation: documentation and test
  planning only.
- Confirm `specs.md` documents input, output, loading, error, fixture, and
  review expectations.

## Future Automated Test Cases

### 1. Valid request mapping

Use the `support-reply-es-en` fixture.

Expected checks:

- Request id is preserved in the result.
- Source and target languages are different.
- Subject and body are both present.
- No warning is required for a short supported message.

### 2. Formatting preservation

Use the `project-update-fr-en` fixture.

Expected checks:

- Bullet-like line breaks remain line-based.
- Greeting and sign-off positions are preserved.
- `preserveFormatting: true` is passed through the local API.

### 3. Size-limit handling

Use the `oversized-draft-de-en` fixture.

Expected checks:

- The request is rejected or split by a future local helper.
- A warning or validation error explains the size limit.
- No live provider call is attempted for over-limit input.

### 4. Validation failure

Use the `missing-target-language` fixture.

Expected checks:

- Validation reports `targetLanguage`.
- Translation does not continue after validation fails.
- Error output is deterministic.

### 5. Empty message protection

Create a local case with empty `subject` and empty `body`.

Expected checks:

- Validation rejects the request.
- Error output includes a clear message.
- No network or provider code is reached.

## Review Command Placeholder

When a future implementation adds local tests, the expected command should stay
folder-local, for example:

```bash
npm run test -- --run tools/v2/individual/email-translator
```

No command is required for this documentation-only contribution.
