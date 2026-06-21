# Email Template Library Security and Performance

This note covers the isolated Email Template Library tool only. The tool is not wired
into the main application, inbox, wallet, Stellar code, database, or routing.

## Threat Assumptions

- Template names, subjects, bodies, and variable labels are untrusted user input.
- Templates may be copied from external systems and can contain active markup,
  tracking snippets, hidden characters, or secret-looking values.
- Future integrations may render templates into compose surfaces, so this folder
  must keep dangerous content out before any main-app bridge exists.
- Fixtures must stay synthetic and must not include real recipients, accounts,
  private keys, wallet addresses, session tokens, or production mailbox data.

## Guarded Inputs

`services/template-safety-guards.mjs` provides folder-local helpers:

- `sanitizeTemplateText` normalizes strings, removes control and zero-width
  characters, normalizes line endings, trims whitespace, and clips large fields.
- `validateTemplateDraft` rejects missing identity fields, empty content, active
  markup, event handlers, dangerous URL schemes, and secret-looking assignments.
- `collectTemplateVariables` extracts `{{variable}}` placeholders without
  rendering or evaluating user content.
- `validateTemplateCollection` rejects duplicate IDs and oversized collections.
- `estimateTemplateCost` returns deterministic size and placeholder metrics so a
  future UI can warn before expensive rendering or search work.

The helpers are deliberately plain JavaScript and use no network calls, browser
APIs, storage APIs, or application imports.

## Unsafe Content Rules

The current guard layer rejects:

- executable or active markup such as `script`, `iframe`, `object`, forms, and
  inline event handlers;
- `javascript:` and HTML `data:` links;
- secret-looking assignments such as `api_key = ...`, `private_key: ...`,
  `token = ...`, or `password: ...`;
- duplicate template IDs in a collection.

It clips:

- template names above 120 characters;
- subjects above 240 characters;
- bodies above 12,000 characters;
- variable declarations above 30 entries per template.

## Performance Limits

The isolated library should remain cheap to review and safe to run locally:

- maximum template collection size: 250 templates;
- maximum combined body text: 600,000 characters;
- maximum estimated render output per template: 16,000 characters;
- large collections should use indexed search in a future integration task.

The helpers scan strings once, avoid recursive parsing, and never expand template
variables. Rendering substitution should continue to report missing variables
rather than attempting network lookup, mailbox reads, or dynamic evaluation.

## Review Checklist

- Run `node --test tools/v2/individual/email-template-library/tests/template-safety-guards.test.mjs`.
- Confirm all changed files stay inside `tools/v2/individual/email-template-library/`.
- Confirm fixtures are synthetic and contain no real account or payment data.
- Confirm no main-app imports, live network calls, storage adapters, or routing
  changes are introduced.
