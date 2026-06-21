# Meeting Assignment Tool

Assign meeting responsibilities to team members based on skills, workload, and capacity.

## Ownership Boundary

All work for this tool must stay inside:

```
tools/v2/team/meeting-assignment-tool/
```

Do not wire this tool into the main app, routing, inbox architecture, wallet
core, Stellar core, database schema, or existing design system unless a future
integration issue explicitly allows it.

## Structure

```
fixtures/           Deterministic local data (team members, sample meetings)
services/           Core pure-function logic, guard helpers, async service factory
tests/              node:test suite (no external runner required)
docs/               Review notes, safety notes, and contributor context
types.ts            All domain types
index.ts            Folder-local public API
```

## Run Tests

```bash
node --test tools/v2/team/meeting-assignment-tool/tests/meeting-assignment.test.mjs
node --test tools/v2/team/meeting-assignment-tool/tests/meeting-assignment-guards.test.mjs
```

The existing assignment suite covers 17 tests. The guard suite covers request
normalization, malformed inputs, duplicate ids, invalid effort, batch caps, work
estimation, and text cleanup.

## Safety and Performance Guard Rails

This folder includes a local guard helper for future meeting assignment input:

- `services/meeting-assignment-guards.mjs` normalizes team member and meeting
  input before assignment work.
- `tests/meeting-assignment-guards.test.mjs` covers valid normalization,
  malformed requests, duplicate ids, invalid effort, large-batch caps, work
  estimation, and control-character cleanup.
- `docs/SAFETY_AND_PERFORMANCE.md` documents unsafe input categories, limits,
  and review checks.
- `docs/SECURITY_REVIEW_NOTES.md` maps the guard helper to issue #632.

The guard helper does not call live calendars, inboxes, wallets, Stellar
services, databases, or external APIs. It is a deterministic boundary for future
integration work.

## Public API

```ts
import { assignMeetings, createMeetingAssignmentService } from "./index";

// Pure function — deterministic, synchronous
const result = assignMeetings({ teamMembers, meetings });
// result.assignments[]  — per-meeting assignment with reason
// result.summary        — totals, coverage %, per-member effort delta

// Async service wrapper — simulates delay/failure for UI dev
const svc = createMeetingAssignmentService({ simulateDelay: false });
const data = await svc.assign();
```

## Assignment Algorithm

1. Sort meetings by priority (desc), then effort (asc).
2. Find members whose skill set covers all `requiredSkills`.
3. Filter by remaining capacity (`weeklyCapacity - currentLoad >= effort`).
4. Pick the least-loaded eligible member; ties broken by higher capacity.
5. Unassigned reason is one of: `"matched"` / `"capacity"` / `"skill_mismatch"`.

## Inputs & Outputs

**Input — `TeamMember`**

| Field                | Type       | Description                         |
| -------------------- | ---------- | ----------------------------------- |
| `id`                 | `string`   | Unique identifier                   |
| `name`               | `string`   | Display name                        |
| `skills`             | `string[]` | Skill tags                          |
| `currentMeetingLoad` | `number`   | Meetings already assigned this week |
| `weeklyCapacity`     | `number`   | Max meetings per week               |

**Input — `Meeting`**

| Field            | Type          | Description                        |
| ---------------- | ------------- | ---------------------------------- |
| `id`             | `string`      | Unique identifier                  |
| `requiredSkills` | `string[]`    | Skills needed (empty = any member) |
| `effort`         | `1 \| 2 \| 3` | Weight consumed from capacity      |
| `priority`       | `number`      | Higher = processed first           |

**Output — `MeetingAssignment`**

| Field        | Type                                      | Description                 |
| ------------ | ----------------------------------------- | --------------------------- |
| `assigneeId` | `string \| null`                              | Assigned member id, or null |
| `status`     | `"assigned" \| "unassigned"`                  | Assignment state            |
| `reason`     | `"matched" \| "capacity" \| "skill_mismatch"` | Why assigned or not         |

See `types.ts` for full type definitions and `docs/review-notes.md` for
contributor notes.
