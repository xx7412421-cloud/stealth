# Safety and Performance Notes

## Scope

These notes apply only to `tools/v2/team/meeting-assignment-tool/`. The tool
remains isolated from the main app shell, routing, wallet code, Stellar
integration, inbox architecture, database state, live calendars, and live
customer data.

## Guard helper

`services/meeting-assignment-guards.mjs` adds a folder-local review boundary for
future meeting assignment requests. It:

- normalizes team member ids, names, roles, skills, meeting titles, and required
  skills;
- removes control characters and normalizes whitespace before any assignment
  work;
- rejects malformed members, malformed meetings, duplicate ids, invalid
  scheduled times, and invalid effort values;
- caps team member and meeting batch sizes before expensive pairwise work;
- records truncation warnings so a future UI can explain why only part of a
  batch was reviewed;
- exposes a small work estimator for routing large batches to async review.

## Current limits

- Team members per batch: 100.
- Meetings per batch: 250.
- Skills per item: 20.
- Meeting duration: 1 to 480 minutes.
- Effort: 1, 2, or 3.
- Priority: 0 to 100.
- Weekly capacity and current load: 0 to 80.

## Unsafe input categories

- Missing or non-array `teamMembers` or `meetings`.
- Team members without both `id` and `name`.
- Meetings without both `id` and `title`.
- Duplicate member or meeting ids inside one batch.
- Meetings with unparseable scheduled times.
- Effort values outside the existing 1 to 3 assignment model.
- Very large batches that would multiply team members by meetings.
- Skill and text values containing control characters or excessive whitespace.

## Review checklist

- Confirm all changed files stay inside the Meeting Assignment Tool folder.
- Confirm the existing `assignMeetings` algorithm remains deterministic.
- Confirm the guard helper does not call live APIs, calendars, inboxes, wallets,
  Stellar services, databases, or network resources.
- Confirm large batches are capped before assignment work is estimated.
- Confirm rejected input returns deterministic error codes reviewers can test.
