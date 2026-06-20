# Email Translator Specs

## Purpose

Email Translator helps an individual convert email content from a source
language to a target language while preserving sender intent, subject context,
and important action items.

## Contributor Boundary

All work for this tool should stay in:

```text
tools/v2/individual/email-translator/
```

This is a self-contained tooling workspace. Do not wire this tool into the main
app, routing, inbox architecture, wallet core, Stellar core, database schema, or
shared design system unless a future integration issue explicitly allows it.

## Input Contract

Future implementation work should treat translation requests as plain local
objects:

```ts
type TranslationRequest = {
  id: string;
  subject: string;
  body: string;
  sourceLanguage: string;
  targetLanguage: string;
  preserveFormatting: boolean;
};
```

## Output Contract

```ts
type TranslationResult = {
  requestId: string;
  translatedSubject: string;
  translatedBody: string;
  detectedLanguage: string;
  warnings: string[];
};
```

## Loading States

- **Idle**: No translation has been requested.
- **Loading**: A translation request is being processed.
- **Success**: Translated subject/body are available with any non-blocking
  warnings.
- **Error**: Input validation fails or translation cannot be completed.

Because this tool is isolated, loading state should be represented by local
state or a folder-local helper in a future implementation. Do not introduce
global app state for this tool.

## Error States

Validation should reject:

- Empty subject and empty body.
- Missing or unsupported target language.
- Matching source and target languages when no translation is needed.
- Bodies that exceed the documented size limit.
- Messages that contain unsupported binary attachment placeholders.

Expected error shape for future code:

```ts
type TranslationValidationError = {
  field: string;
  message: string;
};
```

## Fixture Expectations

Use `fixtures/translation-cases.json` for deterministic review data. The fixture
set includes:

- A short support reply.
- A formatted project update.
- A long message that should trigger size-limit handling.
- A malformed request with an empty target language.

Fixtures must stay synthetic and must not contain real email addresses, real
customer names, account identifiers, wallet addresses, or production data.

## Test Categories

Future automated tests should cover:

1. Valid translation request mapping.
2. Input validation errors.
3. Loading and error-state transitions.
4. Formatting preservation.
5. Warning generation for long or partially unsupported content.
6. Deterministic fixture behavior.

## Review Expectations

Reviewers should verify:

1. All files changed by this issue stay inside the tool folder.
2. The docs explain how to review the tool independently.
3. The test plan is usable before a translation engine exists.
4. Fixtures are deterministic and synthetic.
5. The contribution does not introduce live network calls, secrets, production
   data, or app-wide integration.
