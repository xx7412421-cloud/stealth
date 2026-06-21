# Email Template Library

Personal template system.

## Scope

- Release tier: V2
- Audience: individual
- Folder ownership: `tools/v2/individual/email-template-library/`

This is a self-contained tooling workspace. Do not wire this tool into the main app, routing, inbox architecture, wallet core, Stellar core, or design system unless a future integration issue explicitly allows it.

Recommended internal structure:

- components/
- services/
- hooks/
- tests/
- docs/

## Purpose

Let a single user create, validate, organize, preview, and reuse personal email
templates inside an isolated V2 tool folder.

## Contributor boundary

All work for this tool should stay in:

```text
tools/v2/individual/email-template-library/
```

## Required issue categories

- Architecture
- Feature
- UI and accessibility
- Security and performance
- Testing and documentation

## Security and performance requirements

- Treat template names, subjects, bodies, variables, and categories as untrusted input.
- Reject active markup, dangerous URL schemes, event handlers, and secret-looking values.
- Use synthetic fixtures only; do not include real mailbox, account, wallet, or payment data.
- Keep validation and performance helpers folder-local and deterministic.
- Avoid live network calls, storage adapters, or main-app imports.
