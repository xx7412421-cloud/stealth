import assert from "node:assert/strict";
import test from "node:test";

import {
  TONE_REWRITE_LIMITS,
  cleanToneText,
  normalizeTone,
  prepareToneRewriteInput,
} from "../services/tone-guards.mjs";

test("normalizes a valid tone rewrite request", () => {
  const result = prepareToneRewriteInput({
    subject: "  Quarterly update  ",
    bodyText: "Hello team,\r\n\r\n  Please review the updated launch plan.  ",
    tone: "Friendly",
    constraints: {
      maxWords: 120,
      keepGreeting: true,
      notes: " preserve dates ",
    },
    attachments: [{ name: "brief.pdf", mimeType: "application/pdf", sizeBytes: 2048 }],
    history: [{ role: "user", text: "Make it warmer." }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.subject, "Quarterly update");
  assert.equal(result.value.bodyText, "Hello team,\n\nPlease review the updated launch plan.");
  assert.equal(result.value.tone, "friendly");
  assert.equal(result.value.constraints.keepGreeting, true);
  assert.equal(result.value.constraints.notes, "preserve dates");
  assert.deepEqual(result.value.attachments[0], {
    name: "brief.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
  });
});

test("rejects empty bodies and unsupported tones", () => {
  const result = prepareToneRewriteInput({ bodyText: "  ", tone: "salesy" });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((error) => error.code),
    ["empty_body", "unsupported_tone"],
  );
});

test("removes control characters and caps large body text", () => {
  const longBody = `${"A".repeat(TONE_REWRITE_LIMITS.maxBodyChars + 40)}\u0000`;
  const result = prepareToneRewriteInput({ bodyText: longBody, tone: "concise" });

  assert.equal(result.ok, true);
  assert.equal(result.value.bodyText.length, TONE_REWRITE_LIMITS.maxBodyChars);
  assert.equal(result.value.bodyText.includes("\u0000"), false);
  assert.equal(result.value.truncated.bodyText, true);
});

test("limits attachment metadata and never returns attachment bodies", () => {
  const result = prepareToneRewriteInput({
    bodyText: "Please rewrite this draft.",
    tone: "formal",
    attachments: Array.from({ length: 12 }, (_, index) => ({
      name: `attachment-${index}.txt`,
      mimeType: "text/plain",
      sizeBytes: index,
      body: "raw attachment content that should not be forwarded",
    })),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.attachments.length, TONE_REWRITE_LIMITS.maxAttachmentCount);
  assert.equal(result.value.attachments[0].body, undefined);
  assert.equal(result.value.truncated.attachments, true);
});

test("caps history and constraint notes before rewrite work starts", () => {
  const result = prepareToneRewriteInput({
    bodyText: "Need a cleaner version.",
    tone: "neutral",
    constraints: { notes: "x".repeat(TONE_REWRITE_LIMITS.maxConstraintChars + 20) },
    history: Array.from({ length: 10 }, (_, index) => ({
      role: "assistant",
      text: `previous answer ${index} ${"y".repeat(TONE_REWRITE_LIMITS.maxHistoryChars + 20)}`,
    })),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.constraints.notes.length, TONE_REWRITE_LIMITS.maxConstraintChars);
  assert.equal(result.value.history.length, TONE_REWRITE_LIMITS.maxHistoryItems);
  assert.equal(result.value.history[0].text.length, TONE_REWRITE_LIMITS.maxHistoryChars);
  assert.equal(result.value.truncated.history, true);
});

test("exposes deterministic text and tone helpers", () => {
  assert.equal(cleanToneText(" a\t\tb\u0000c ", 10), "a bc");
  assert.equal(normalizeTone("APOLOGETIC"), "apologetic");
  assert.equal(normalizeTone("urgent"), "");
});
