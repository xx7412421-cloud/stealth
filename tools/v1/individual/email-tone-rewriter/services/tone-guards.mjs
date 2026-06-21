export const SUPPORTED_TONES = Object.freeze([
  "apologetic",
  "concise",
  "formal",
  "friendly",
  "neutral",
]);

export const TONE_REWRITE_LIMITS = Object.freeze({
  maxSubjectChars: 240,
  maxBodyChars: 12000,
  maxConstraintChars: 240,
  maxAttachmentCount: 8,
  maxAttachmentNameChars: 120,
  maxHistoryItems: 6,
  maxHistoryChars: 1600,
});

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const WHITESPACE_PATTERN = /[ \t]+/g;

function coerceString(value) {
  return typeof value === "string" ? value : "";
}

export function cleanToneText(value, maxChars) {
  return coerceString(value)
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(WHITESPACE_PATTERN, " ").trim())
    .join("\n")
    .trim()
    .slice(0, maxChars);
}

export function normalizeTone(value) {
  const tone = coerceString(value).trim().toLowerCase();
  return SUPPORTED_TONES.includes(tone) ? tone : "";
}

function normalizeConstraints(constraints, limits) {
  const source =
    constraints && typeof constraints === "object" && !Array.isArray(constraints)
      ? constraints
      : {};

  return {
    maxWords:
      Number.isInteger(source.maxWords) && source.maxWords > 0
        ? Math.min(source.maxWords, 500)
        : null,
    keepGreeting: source.keepGreeting === true,
    keepSignature: source.keepSignature !== false,
    notes: cleanToneText(source.notes, limits.maxConstraintChars),
  };
}

function normalizeAttachments(attachments, limits) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.slice(0, limits.maxAttachmentCount).map((attachment) => {
    const source =
      attachment && typeof attachment === "object" && !Array.isArray(attachment)
        ? attachment
        : {};

    return {
      name: cleanToneText(source.name, limits.maxAttachmentNameChars),
      mimeType: cleanToneText(source.mimeType, 80),
      sizeBytes:
        Number.isFinite(source.sizeBytes) && source.sizeBytes >= 0
          ? Math.floor(source.sizeBytes)
          : null,
    };
  });
}

function normalizeHistory(history, limits) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.slice(0, limits.maxHistoryItems).map((entry) => {
    const source =
      entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {};

    return {
      role: cleanToneText(source.role, 40),
      text: cleanToneText(source.text, limits.maxHistoryChars),
    };
  });
}

function buildError(field, code, message) {
  return { field, code, message };
}

export function prepareToneRewriteInput(input, options = {}) {
  const limits = { ...TONE_REWRITE_LIMITS, ...options };
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      errors: [
        buildError("request", "invalid_request", "Expected a tone rewrite request object."),
      ],
    };
  }

  const subject = cleanToneText(input.subject, limits.maxSubjectChars);
  const bodyText = cleanToneText(input.bodyText, limits.maxBodyChars);
  const tone = normalizeTone(input.tone);
  const constraints = normalizeConstraints(input.constraints, limits);
  const attachments = normalizeAttachments(input.attachments, limits);
  const history = normalizeHistory(input.history, limits);

  if (!bodyText) {
    errors.push(
      buildError("bodyText", "empty_body", "Draft body text is required before rewriting."),
    );
  }

  if (!tone) {
    errors.push(
      buildError(
        "tone",
        "unsupported_tone",
        `Tone must be one of: ${SUPPORTED_TONES.join(", ")}.`,
      ),
    );
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      subject,
      bodyText,
      tone,
      constraints,
      attachments,
      history,
      truncated: {
        bodyText: coerceString(input.bodyText).length > bodyText.length,
        attachments:
          Array.isArray(input.attachments) &&
          input.attachments.length > attachments.length,
        history: Array.isArray(input.history) && input.history.length > history.length,
      },
    },
  };
}
