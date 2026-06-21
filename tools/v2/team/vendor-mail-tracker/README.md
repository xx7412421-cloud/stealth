# Vendor Mail Tracker

Vendor Mail Tracker is an isolated V2 team tool workspace for tracking vendor
communications, outstanding replies, blockers, and follow-up ownership before a
future mail-app integration.

## Ownership Boundary

All work for this tool must stay inside:

tools/v2/team/vendor-mail-tracker/

Do not wire this tool into the main app, routing, inbox architecture, wallet
core, Stellar core, database schema, or shared design system unless a future
integration issue explicitly allows it.

## Reviewer Setup

This folder includes local documentation, fixtures, guard helpers, and standalone
Node tests. No app install is required to review this contribution.

Run from the repository root:

node --test tools/v2/team/vendor-mail-tracker/tests/vendor-mail-fixtures.test.mjs
node --test tools/v2/team/vendor-mail-tracker/tests/vendor-mail-guards.test.mjs

The fixture test validates the sample vendor-mail fixture against the local
review contract in specs.md. The guard test validates malformed-record handling,
text cleanup, attachment caps, date checks, and large-batch truncation.

## Tracking Workflow

1. Capture vendor messages from synthetic email records.
2. Normalize each thread into vendor, owner, status, last contact, and due date.
3. Route each thread to open, waiting-on-vendor, blocked, or resolved.
4. Preserve a source message id for traceability.
5. Flag stale, blocked, high-priority, or oversized-attachment threads for human
   review.

## Fixtures

The folder-local fixture at fixtures/sample-vendor-mails.json contains:

- an open onboarding thread that needs an internal owner response
- a waiting-on-vendor thread with a pending security questionnaire
- a blocked invoice thread missing required documentation
- a resolved renewal thread with complete owner evidence

The fixture intentionally uses example.test addresses, synthetic vendor names,
and fake thread ids so contributors can validate behavior without using real
vendor, invoice, customer, or mailbox data.

## Documentation Map

- specs.md defines the local vendor-mail tracking contract and scope.
- docs/test-plan.md lists automated and manual review steps.
- docs/review-notes.md explains validation and known limits.
- docs/security-performance-notes.md documents unsafe inputs and performance limits.
- services/vendor-mail-guards.mjs contains folder-local guard helpers.
- tests/vendor-mail-fixtures.test.mjs validates the fixture contract.
- tests/vendor-mail-guards.test.mjs validates guard behavior.

## Known Limitations

- This contribution does not add app UI or live mailbox ingestion.
- Tracking behavior is represented through fixture expectations and folder-local
  guards only.
- Vendor authentication, attachment storage, billing workflows, notifications,
  and live mailbox connections remain out of scope for this isolated V2 folder.
