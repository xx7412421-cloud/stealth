# Security and Performance Notes

## Threat Assumptions

Vendor Mail Tracker is still an isolated V2 team tool. It must not read live
mailboxes, store attachment bodies, call external vendor systems, or depend on
main-app authentication until a future integration issue explicitly allows that
work.

Future integrations should treat every imported vendor thread as untrusted
input. A mailbox connector, CSV import, webhook, or manual paste can provide
malformed records, missing identifiers, unexpectedly large payloads, or text that
should not be rendered as markup.

## Unsafe Input Categories

- non-object records or arrays where a thread record is expected
- missing id, vendor, owner, or sourceMessageId
- unknown priority or status values
- invalid lastContactAt or unresolved-thread nextActionDueAt dates
- control characters, angle brackets, or backticks in display text
- long subject, vendor, owner, or preview fields
- excessive attachment lists, large attachment metadata, or missing names
- long history arrays that would slow review screens without adding value

## Guard Helper Contract

services/vendor-mail-guards.mjs provides two folder-local helpers:

- normalizeVendorMailThread(record, options) validates one record, cleans text,
  caps attachment metadata, caps history entries, and marks records that need
  human review.
- prepareVendorMailReview(records, options) limits large review batches before
  normalization and separates accepted records from rejected records.

The helpers return validation results instead of throwing so a future UI can show
reviewable errors without breaking the entire tool.

## Performance Constraints

The default guard limits are intentionally conservative for a team review tool:

- no more than 250 threads are prepared in one review batch
- body previews are trimmed to 1,200 characters
- attachment metadata is capped at 8 attachments per thread
- attachment names are trimmed before display
- individual attachment size metadata is capped at 15 MB
- only the latest 25 history events are retained per thread

These limits avoid unnecessary work on large imports while preserving enough
metadata for reviewers to understand ownership, status, due date, and source
traceability.

## Review Guidance

Keep future changes in this folder until an integration issue allows otherwise.
Do not add production mailbox data, vendor credentials, attachment bodies,
external requests, main-app routing, or shared auth logic in this isolated tool.
