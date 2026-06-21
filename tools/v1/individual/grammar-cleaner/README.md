# Grammar Cleaner

This folder is the isolated workspace for the Grammar Cleaner tool.

## Ownership Boundary

All work for this tool must stay inside:

`tools/v1/individual/grammar-cleaner/`

Do not wire this tool into the main app, routing, inbox architecture, wallet
core, Stellar core, database schema, or existing design system unless a future
integration issue explicitly allows it.

## Local UI Surface

- `components/GrammarCleanerPanel.tsx` provides the isolated grammar-cleaning
  workflow surface.
- `docs/ui-accessibility-notes.md` documents empty, loading, error, and success
  states plus keyboard, focus, labeling, and screen-reader behavior.
- `REVIEW_NOTES.md` gives reviewers a short checklist for this issue.

The panel uses deterministic local preview text and does not call a live grammar
service, save drafts, send email, or mount into the application shell.

## Intended Usage

The tool helps an individual user paste an email draft, choose how much cleanup
to apply, and review a grammar-cleaned preview before a future integration issue
connects it to production mail flows.

## Known Limitations

- The UI is folder-local and not mounted in the main app.
- The cleaned preview is deterministic placeholder behavior for review.
- Main app routing, inbox integration, send actions, persistence, and shared
  design-system files remain out of scope.
