# Email Translator

This folder is the isolated workspace for the Email Translator tool.

## Ownership Boundary

All work for this tool must stay inside:

`text
.\tools\v2\individual\email-translator\
`

Do not wire this tool into the main app, routing, inbox architecture, wallet core, Stellar core, database schema, or existing design system unless a future integration issue explicitly allows it.

See specs.md for the issue categories and contributor expectations.

## Local UI Surface

- `components/EmailTranslatorPanel.tsx` provides the isolated translator workflow surface.
- `docs/ui-accessibility-notes.md` documents empty, loading, error, and success states plus keyboard and screen-reader behavior.
- The UI uses local deterministic preview text and does not call a live translation service.
