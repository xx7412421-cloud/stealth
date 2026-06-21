# Email Template Library

This folder is the isolated workspace for the Email Template Library tool, a
V2 individual mini-product for creating and reusing personal email templates.

## Ownership Boundary

All work for this tool must stay inside:

```text
tools/v2/individual/email-template-library/
```

Do not wire this tool into the main app, routing, inbox architecture, wallet core, Stellar core, database schema, or existing design system unless a future integration issue explicitly allows it.

## Local Safety Surface

This folder includes a local guard layer for template input validation,
sanitization, and performance estimation:

```bash
node --test tools/v2/individual/email-template-library/tests/template-safety-guards.test.mjs
```

See `docs/SECURITY_AND_PERFORMANCE.md` for the threat assumptions, unsafe input
rules, limits, and review checklist.
