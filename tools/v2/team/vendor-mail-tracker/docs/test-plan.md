# Test Plan

## Automated Fixture Test

Run from the repository root:

node --test tools/v2/team/vendor-mail-tracker/tests/vendor-mail-fixtures.test.mjs

Expected result:

- the sample fixture parses as JSON
- each source message maps to one expected vendor thread
- all local vendor thread statuses are represented
- thread priorities are limited to the local priority set
- blocked threads require human review
- resolved threads do not require a next action due date

## Automated Guard Test

Run from the repository root:

node --test tools/v2/team/vendor-mail-tracker/tests/vendor-mail-guards.test.mjs

Expected result:

- malformed records are rejected before review work starts
- display text is cleaned before it reaches a future UI
- high-priority unresolved threads require human review
- excessive attachment metadata is capped
- oversized attachment metadata marks a thread for review
- invalid dates and missing owners are reported
- large review batches are truncated before normalization

## Manual Review Checklist

1. Open fixtures/sample-vendor-mails.json.
2. Confirm all source messages use synthetic data.
3. Confirm each expected thread has a traceable sourceMessageId.
4. Confirm services/vendor-mail-guards.mjs returns structured validation results.
5. Confirm docs/security-performance-notes.md documents unsafe inputs and performance limits.
6. Confirm no files outside tools/v2/team/vendor-mail-tracker/ changed.

## Edge Cases Covered

- active vendor onboarding thread
- high-priority waiting-on-vendor thread
- blocked invoice thread with missing supporting documentation
- resolved procurement thread without future due date
- malformed thread records
- invalid dates and missing owners
- oversized or excessive attachment metadata
- large batches that exceed the local review limit

## Future Integration Tests

When implementation code is connected to a UI or import flow, add tests for:

- stale thread threshold configuration
- duplicate vendor thread detection
- attachment and document presence checks
- owner assignment and reassignment
- notification throttling and audit log creation
- surfacing guard validation errors without connecting to live mailbox data
