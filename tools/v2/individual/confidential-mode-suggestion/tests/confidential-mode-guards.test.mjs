import assert from "node:assert/strict";
import test from "node:test";

import {
  CONFIDENTIAL_MODE_LIMITS,
  cleanConfidentialText,
  prepareConfidentialModeInput,
  suggestConfidentialMode,
} from "../services/confidential-mode-guards.mjs";

test("normalizes a valid confidential-mode request", () => {
  const result = prepareConfidentialModeInput({
    subject: "  Contract follow-up  ",
    bodyText: "Please review the settlement draft.\r\nThanks.",
    recipients: [" legal@example.test ", " finance@example.test "],
    attachments: [{ name: "contract.pdf", mimeType: "application/pdf", sizeBytes: 4096 }],
    context: " external counsel ",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.subject, "Contract follow-up");
  assert.equal(result.value.bodyText, "Please review the settlement draft.\nThanks.");
  assert.deepEqual(result.value.recipients, ["legal@example.test", "finance@example.test"]);
  assert.deepEqual(result.value.attachments[0], {
    name: "contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: 4096,
  });
  assert.equal(result.value.context, "external counsel");
});

test("rejects empty request content with deterministic errors", () => {
  const result = prepareConfidentialModeInput({ subject: " ", bodyText: "" });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors.map((error) => error.code), ["empty_message"]);
});

test("caps large bodies, recipients, and attachments before scoring", () => {
  const result = prepareConfidentialModeInput({
    bodyText: "A".repeat(CONFIDENTIAL_MODE_LIMITS.maxBodyChars + 100),
    recipients: Array.from({ length: 40 }, (_, index) => `person-${index}@example.test`),
    attachments: Array.from({ length: 20 }, (_, index) => ({
      name: `file-${index}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: index,
      body: "raw file content should not be forwarded",
    })),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.bodyText.length, CONFIDENTIAL_MODE_LIMITS.maxBodyChars);
  assert.equal(result.value.recipients.length, CONFIDENTIAL_MODE_LIMITS.maxRecipientCount);
  assert.equal(result.value.attachments.length, CONFIDENTIAL_MODE_LIMITS.maxAttachmentCount);
  assert.equal(result.value.attachments[0].body, undefined);
  assert.equal(result.value.truncated.bodyText, true);
  assert.equal(result.value.truncated.recipients, true);
  assert.equal(result.value.truncated.attachments, true);
});

test("recommends confidential mode when multiple privacy signals are present", () => {
  const result = suggestConfidentialMode({
    subject: "Confidential contract and payroll update",
    bodyText: "The attachment includes payroll details and bank account instructions.",
    recipients: ["owner@example.test", "finance@example.test"],
    attachments: [{ name: "payroll-instructions.pdf", mimeType: "application/pdf" }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.recommendation, "enable-confidential-mode");
  assert.equal(result.value.reviewRequired, false);
  assert.ok(result.value.signals.length >= 2);
  assert.ok(result.value.safeguards.includes("set an expiration"));
});

test("keeps low-signal drafts reviewable without auto-enabling", () => {
  const result = suggestConfidentialMode({
    subject: "Lunch plan",
    bodyText: "Can we move lunch to tomorrow?",
    recipients: ["friend@example.test"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.recommendation, "no-confidential-mode-needed");
  assert.equal(result.value.reviewRequired, true);
});

test("exposes deterministic text cleanup", () => {
  assert.equal(cleanConfidentialText(" a\t\tb\u0000c ", 20), "a bc");
});
