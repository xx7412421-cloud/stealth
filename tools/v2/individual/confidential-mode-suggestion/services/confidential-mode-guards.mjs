export const CONFIDENTIAL_MODE_LIMITS = Object.freeze({
  maxSubjectChars: 240,
  maxBodyChars: 12000,
  maxRecipientCount: 25,
  maxRecipientChars: 160,
  maxAttachmentCount: 10,
  maxAttachmentNameChars: 120,
  maxContextChars: 600,
});

export const PRIVACY_SIGNAL_GROUPS = Object.freeze({
  personal: ["passport", "tax id", "national id", "home address", "phone number"],
  financial: ["bank account", "invoice", "payroll", "wire", "routing number"],
  account: ["password", "recovery code", "one-time code", "api key", "private key"],
  legal: ["nda", "contract", "settlement", "legal review", "confidential"],
});

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const WHITESPACE_PATTERN = /[ \t]+/g;

function coerceString(value) {
  return typeof value === "string" ? value : "";
}

export function cleanConfidentialText(value, maxChars) {
  return coerceString(value)
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(WHITESPACE_PATTERN, " ").trim())
    .join("\n")
    .trim()
    .slice(0, maxChars);
}

function normalizeRecipients(recipients, limits) {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return recipients
    .slice(0, limits.maxRecipientCount)
    .map((recipient) => cleanConfidentialText(recipient, limits.maxRecipientChars))
    .filter(Boolean);
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
      name: cleanConfidentialText(source.name, limits.maxAttachmentNameChars),
      mimeType: cleanConfidentialText(source.mimeType, 80),
      sizeBytes:
        Number.isFinite(source.sizeBytes) && source.sizeBytes >= 0
          ? Math.floor(source.sizeBytes)
          : null,
    };
  });
}

function findPrivacySignals(text) {
  const lowered = text.toLowerCase();
  const signals = [];

  for (const [group, words] of Object.entries(PRIVACY_SIGNAL_GROUPS)) {
    for (const word of words) {
      if (lowered.includes(word)) {
        signals.push({ group, word });
      }
    }
  }

  return signals;
}

function scoreRecommendation(normalized, signals) {
  let score = signals.length * 2;

  if (normalized.attachments.length > 0) {
    score += 1;
  }
  if (normalized.recipients.length > 5) {
    score += 1;
  }
  if (normalized.bodyText.length > 3000) {
    score += 1;
  }

  if (score >= 4) {
    return {
      recommendation: "enable-confidential-mode",
      confidence: 0.92,
      reviewRequired: false,
    };
  }

  if (score >= 2) {
    return {
      recommendation: "review-before-sending",
      confidence: 0.72,
      reviewRequired: true,
    };
  }

  return {
    recommendation: "no-confidential-mode-needed",
    confidence: 0.58,
    reviewRequired: true,
  };
}

export function prepareConfidentialModeInput(input, options = {}) {
  const limits = { ...CONFIDENTIAL_MODE_LIMITS, ...options };

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      errors: [
        {
          field: "request",
          code: "invalid_request",
          message: "Expected a confidential mode suggestion request object.",
        },
      ],
    };
  }

  const subject = cleanConfidentialText(input.subject, limits.maxSubjectChars);
  const bodyText = cleanConfidentialText(input.bodyText, limits.maxBodyChars);
  const recipients = normalizeRecipients(input.recipients, limits);
  const attachments = normalizeAttachments(input.attachments, limits);
  const context = cleanConfidentialText(input.context, limits.maxContextChars);

  if (!subject && !bodyText) {
    return {
      ok: false,
      errors: [
        {
          field: "bodyText",
          code: "empty_message",
          message: "Subject or body text is required before suggesting privacy protections.",
        },
      ],
    };
  }

  return {
    ok: true,
    value: {
      subject,
      bodyText,
      recipients,
      attachments,
      context,
      truncated: {
        bodyText: coerceString(input.bodyText).length > bodyText.length,
        recipients:
          Array.isArray(input.recipients) && input.recipients.length > recipients.length,
        attachments:
          Array.isArray(input.attachments) &&
          input.attachments.length > attachments.length,
      },
    },
  };
}

export function suggestConfidentialMode(input, options = {}) {
  const prepared = prepareConfidentialModeInput(input, options);
  if (!prepared.ok) {
    return prepared;
  }

  const normalized = prepared.value;
  const signals = findPrivacySignals(
    `${normalized.subject}\n${normalized.bodyText}\n${normalized.context}`,
  );
  const scoring = scoreRecommendation(normalized, signals);

  return {
    ok: true,
    value: {
      ...normalized,
      signals,
      ...scoring,
      safeguards:
        scoring.recommendation === "enable-confidential-mode"
          ? ["limit forwarding", "set an expiration", "avoid broad recipient lists"]
          : ["review recipients", "confirm attachment names"],
    },
  };
}
