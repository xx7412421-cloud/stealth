import assert from "node:assert/strict";
import test from "node:test";

import {
  MEETING_ASSIGNMENT_GUARD_LIMITS,
  cleanMeetingAssignmentText,
  estimateMeetingAssignmentWork,
  prepareMeetingAssignmentInput,
} from "../services/meeting-assignment-guards.mjs";

const validMember = {
  id: " alice ",
  name: " Alice ",
  role: " Facilitator ",
  skills: ["Planning", "planning", "UX"],
  currentMeetingLoad: 1,
  weeklyCapacity: 6,
};

const validMeeting = {
  id: " mtg-1 ",
  title: " Sprint planning ",
  scheduledAt: "2026-06-30T10:00:00Z",
  durationMinutes: 45,
  requiredSkills: ["planning", "UX"],
  effort: 2,
  priority: 5,
};

test("normalizes valid team members and meetings", () => {
  const result = prepareMeetingAssignmentInput({
    teamMembers: [validMember],
    meetings: [validMeeting],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.teamMembers[0].id, "alice");
  assert.equal(result.value.teamMembers[0].name, "Alice");
  assert.deepEqual(result.value.teamMembers[0].skills, ["planning", "ux"]);
  assert.equal(result.value.meetings[0].title, "Sprint planning");
  assert.deepEqual(result.value.meetings[0].requiredSkills, ["planning", "ux"]);
});

test("rejects malformed top-level requests with deterministic errors", () => {
  assert.deepEqual(prepareMeetingAssignmentInput(null).errors.map((error) => error.code), [
    "invalid_request",
  ]);

  const result = prepareMeetingAssignmentInput({ teamMembers: "nope", meetings: null });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map((error) => error.code), [
    "invalid_team_members",
    "invalid_meetings",
  ]);
});

test("rejects duplicate ids and invalid meeting effort", () => {
  const result = prepareMeetingAssignmentInput({
    teamMembers: [validMember, { ...validMember, name: "Alice Copy" }],
    meetings: [validMeeting, { ...validMeeting, id: "mtg-2", effort: 4 }],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map((error) => error.code), [
    "duplicate_member_id",
    "invalid_effort",
  ]);
});

test("caps large batches before assignment work is estimated", () => {
  const result = prepareMeetingAssignmentInput({
    teamMembers: Array.from({ length: 120 }, (_, index) => ({
      ...validMember,
      id: `member-${index}`,
      name: `Member ${index}`,
    })),
    meetings: Array.from({ length: 300 }, (_, index) => ({
      ...validMeeting,
      id: `meeting-${index}`,
      title: `Planning ${index}`,
    })),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.teamMembers.length, MEETING_ASSIGNMENT_GUARD_LIMITS.maxTeamMembers);
  assert.equal(result.value.meetings.length, MEETING_ASSIGNMENT_GUARD_LIMITS.maxMeetings);
  assert.equal(result.value.truncated.teamMembers, true);
  assert.equal(result.value.truncated.meetings, true);
  assert.deepEqual(result.value.warnings.map((warning) => warning.code), [
    "team_members_truncated",
    "meetings_truncated",
  ]);
});

test("estimates large assignment work for review routing", () => {
  const estimate = estimateMeetingAssignmentWork({
    teamMembers: Array.from({ length: 100 }),
    meetings: Array.from({ length: 250 }),
  });

  assert.equal(estimate.memberCount, 100);
  assert.equal(estimate.meetingCount, 250);
  assert.equal(estimate.skillComparisons, 25000);
  assert.equal(estimate.shouldDefer, true);
});

test("removes control characters while preserving readable text", () => {
  assert.equal(cleanMeetingAssignmentText(" sprint\t\tplanning\u0000 ", 80), "sprint planning");
});
