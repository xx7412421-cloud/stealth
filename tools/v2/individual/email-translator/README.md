# Email Translator

Email Translator is an isolated V2 individual tool workspace for translating
email content between languages. It is not wired into the main mail app yet; the
folder documents the local review contract and test plan until future issues add
the core engine or user interface.

## Ownership Boundary

All work for this tool must stay inside:

```text
tools/v2/individual/email-translator/
```

Do not modify the main application shell, dashboard layout, routing, inbox
architecture, wallet core, Stellar integration, database schema, or shared
design system from this issue.

## Current Scope

This contribution focuses on contributor-friendly testing and documentation. It
does not add a translation provider, network calls, persistence, React
components, hooks, or app integration.

## Review Map

- `specs.md` defines the tool contract, loading states, error states, fixtures,
  and known limitations.
- `tests/test-plan.md` gives a folder-local manual and future automated test
  plan.
- `docs/review-notes.md` gives maintainers a self-contained review checklist.
- `fixtures/translation-cases.json` provides deterministic fake email samples
  that future tests can reuse.

## Setup

No app-wide setup is required for this documentation-only contribution.

Future code contributions should keep tests local to this folder and use the
fixture cases in `fixtures/translation-cases.json` instead of live email data or
external translation services.

## Known Limitations

- No translation engine is implemented in this issue.
- No live network calls or third-party translation provider are used.
- No production email, account, wallet, or contact data is included.
- No UI is mounted in the main application.
- Automated tests should be added by a later implementation issue once core
  behavior exists.
