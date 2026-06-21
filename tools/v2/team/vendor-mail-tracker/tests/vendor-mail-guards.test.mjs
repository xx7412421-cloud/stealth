import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeVendorMailThread,
  prepareVendorMailReview,
  vendorMailGuardLimits,
} from "../services/vendor-mail-guards.mjs";

function validThread(overrides = {}) {
  return {
    id: "thread-1",
    vendor: "Acme Procurement",
    owner: "ops-team@example.test",
    priority: "medium",
    status: "open",
    lastContactAt: "2026-06-01T09:00:00.000Z",
    nextActionDueAt: "2026-06-03T09:00:00.000Z",
    sourceMessageId: "msg-1",
    subject: "Invoice follow-up",
    bodyPreview: "Waiting for vendor documents.",
    attachments: [],
    history: [],
    ...overrides,
  };
}

test("rejects malformed records before review work starts", () => {
  const result = normalizeVendorMailThread(null);

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["thread record must be an object"]);
  assert.equal(result.thread, null);
});

test("normalizes unsafe text and keeps review-critical metadata", () => {
  const result = normalizeVendorMailThread(
    validThread({
      vendor: "<Acme>\u0000 Procurement",
      subject: "  Renewal\n\nrequest  ",
      priority: "HIGH",
      status: "open",
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.thread.vendor, "Acme Procurement");
  assert.equal(result.thread.subject, "Renewal request");
  assert.equal(result.thread.priority, "high");
  assert.equal(result.thread.reviewRequired, true);
});

test("limits attachments and marks oversized files for review", () => {
  const attachments = Array.from({ length: vendorMailGuardLimits.maxAttachmentCount + 2 }, (_, index) => ({
    name: "contract-" + index + ".pdf",
    mimeType: "application/pdf",
    sizeBytes: index === 0 ? vendorMailGuardLimits.maxAttachmentSizeBytes + 1 : 512,
  }));

  const result = normalizeVendorMailThread(validThread({ attachments }));

  assert.equal(result.ok, true);
  assert.equal(result.thread.attachments.length, vendorMailGuardLimits.maxAttachmentCount);
  assert.equal(result.thread.attachments[0].tooLarge, true);
  assert.equal(result.thread.reviewRequired, true);
  assert.ok(result.warnings.includes("attachments capped at " + vendorMailGuardLimits.maxAttachmentCount));
});

test("requires valid dates and required identifiers", () => {
  const result = normalizeVendorMailThread(
    validThread({
      owner: "",
      status: "waiting-on-vendor",
      lastContactAt: "not-a-date",
      nextActionDueAt: "",
    }),
  );

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("owner is required"));
  assert.ok(result.errors.includes("lastContactAt must be a valid date"));
  assert.ok(result.errors.includes("nextActionDueAt must be valid until the thread is resolved"));
});

test("caps large review batches before normalization", () => {
  const records = [
    validThread({ id: "thread-1" }),
    validThread({ id: "thread-2" }),
    validThread({ id: "thread-3" }),
  ];

  const result = prepareVendorMailReview(records, { limits: { maxThreadsPerReview: 2 } });

  assert.equal(result.totalReceived, 3);
  assert.equal(result.processed, 2);
  assert.equal(result.truncated, 1);
  assert.equal(result.accepted.length, 2);
});
