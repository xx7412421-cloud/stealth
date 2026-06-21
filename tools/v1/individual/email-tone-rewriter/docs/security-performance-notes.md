# Email Tone Rewriter Safety and Performance Notes

## Scope

These notes apply only to `tools/v1/individual/email-tone-rewriter/`.
The tool remains isolated from the main app shell, routing, wallet code,
Stellar integration, database, inbox rendering, and the shared design system.

## Input assumptions

- Requests are treated as untrusted draft data until normalized.
- `bodyText` is required and must be a string after cleanup.
- `tone` must be one of the supported local values: apologetic, concise,
  formal, friendly, or neutral.
- Attachment bodies are not accepted by the guard helper. Only bounded metadata
  such as filename, MIME type, and byte size is kept.
- Conversation history is optional and capped before any future rewrite work
  starts.

## Unsafe input categories

- Empty or whitespace-only drafts.
- Unsupported tone names.
- Drafts containing control characters or inconsistent newline formats.
- Very large drafts, attachment lists, or history arrays.
- Attachment objects that include raw body content.
- Constraint notes that are too large to review comfortably.

## Guard helper behavior

`services/tone-guards.mjs` exposes `prepareToneRewriteInput()`. It returns a
deterministic success or error object so a future UI can show validation errors
without guessing.

The helper:

- removes control characters and normalizes line endings;
- trims noisy whitespace while preserving paragraph boundaries;
- caps subject, body, constraint, attachment, and history sizes;
- keeps only attachment metadata;
- records whether large fields were truncated;
- rejects unsupported tones and empty drafts before rewrite work begins.

## Performance limits

The current local limits are intentionally small enough for a V1 individual
tool:

- subject: 240 characters;
- body text: 12,000 characters;
- constraint notes: 240 characters;
- attachments: 8 metadata entries;
- attachment names: 120 characters;
- history: 6 entries;
- history text: 1,600 characters per entry.

These caps prevent unnecessary work on large requests while preserving enough
context for a reviewable tone rewrite.

## Reviewer checklist

- Confirm all changed files stay inside the Email Tone Rewriter folder.
- Confirm the helper does not call external services.
- Confirm raw attachment body content is not forwarded.
- Confirm validation errors are deterministic.
- Confirm large inputs are capped before future rewrite logic would run.
