const DEFAULT_LIMITS = Object.freeze({
  maxThreadsPerReview: 250,
  maxTextLength: 240,
  maxBodyPreviewLength: 1200,
  maxAttachmentCount: 8,
  maxAttachmentNameLength: 120,
  maxAttachmentSizeBytes: 15 * 1024 * 1024,
  maxHistoryEvents: 25,
});

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_STATUSES = new Set(["open", "waiting-on-vendor", "blocked", "resolved"]);

function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeLimits(overrides = {}) {
  return { ...DEFAULT_LIMITS, ...overrides };
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>\`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeAttachments(value, limits, warnings) {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.length > limits.maxAttachmentCount) {
    warnings.push("attachments capped at " + limits.maxAttachmentCount);
  }

  return value.slice(0, limits.maxAttachmentCount).map((attachment, index) => {
    const source = isPlainRecord(attachment) ? attachment : {};
    const sizeBytes = Number(source.sizeBytes ?? 0);

    return {
      index,
      name: cleanText(source.name, limits.maxAttachmentNameLength) || "attachment-" + (index + 1),
      mimeType: cleanText(source.mimeType, 80) || "application/octet-stream",
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.min(sizeBytes, limits.maxAttachmentSizeBytes) : 0,
      tooLarge: Number.isFinite(sizeBytes) && sizeBytes > limits.maxAttachmentSizeBytes,
    };
  });
}

function normalizeHistory(value, limits, warnings) {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.length > limits.maxHistoryEvents) {
    warnings.push("history capped at " + limits.maxHistoryEvents);
  }

  return value.slice(-limits.maxHistoryEvents).map((event, index) => {
    const source = isPlainRecord(event) ? event : {};
    return {
      index,
      at: cleanDate(source.at),
      actor: cleanText(source.actor, limits.maxTextLength),
      note: cleanText(source.note, limits.maxTextLength),
    };
  });
}

export function normalizeVendorMailThread(input, options = {}) {
  const limits = mergeLimits(options.limits);
  const errors = [];
  const warnings = [];

  if (!isPlainRecord(input)) {
    return {
      ok: false,
      errors: ["thread record must be an object"],
      warnings,
      thread: null,
    };
  }

  const id = cleanText(input.id, limits.maxTextLength);
  const vendor = cleanText(input.vendor, limits.maxTextLength);
  const owner = cleanText(input.owner, limits.maxTextLength);
  const sourceMessageId = cleanText(input.sourceMessageId, limits.maxTextLength);
  const priority = cleanText(input.priority, 40).toLowerCase();
  const status = cleanText(input.status, 60).toLowerCase();
  const lastContactAt = cleanDate(input.lastContactAt);
  const nextActionDueAt = status === "resolved" ? null : cleanDate(input.nextActionDueAt);

  if (!id) errors.push("id is required");
  if (!vendor) errors.push("vendor is required");
  if (!owner) errors.push("owner is required");
  if (!sourceMessageId) errors.push("sourceMessageId is required");
  if (!ALLOWED_PRIORITIES.has(priority)) errors.push("priority must be low, medium, or high");
  if (!ALLOWED_STATUSES.has(status)) errors.push("status must be open, waiting-on-vendor, blocked, or resolved");
  if (!lastContactAt) errors.push("lastContactAt must be a valid date");
  if (status !== "resolved" && !nextActionDueAt) errors.push("nextActionDueAt must be valid until the thread is resolved");

  const attachments = normalizeAttachments(input.attachments, limits, warnings);
  const history = normalizeHistory(input.history, limits, warnings);
  const bodyPreview = cleanText(input.bodyPreview, limits.maxBodyPreviewLength);

  const reviewRequired =
    input.reviewRequired === true ||
    status === "blocked" ||
    (priority === "high" && status !== "resolved") ||
    attachments.some((attachment) => attachment.tooLarge);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    thread: {
      id,
      vendor,
      owner,
      priority,
      status,
      lastContactAt,
      nextActionDueAt,
      sourceMessageId,
      subject: cleanText(input.subject, limits.maxTextLength),
      bodyPreview,
      attachments,
      history,
      reviewRequired,
    },
  };
}

export function prepareVendorMailReview(records, options = {}) {
  const limits = mergeLimits(options.limits);
  const input = Array.isArray(records) ? records : [];
  const selected = input.slice(0, limits.maxThreadsPerReview);
  const normalized = selected.map((record) => normalizeVendorMailThread(record, { limits }));

  return {
    totalReceived: input.length,
    processed: selected.length,
    truncated: Math.max(0, input.length - selected.length),
    accepted: normalized.filter((item) => item.ok).map((item) => item.thread),
    rejected: normalized
      .filter((item) => !item.ok)
      .map((item, index) => ({ index, errors: item.errors })),
    warnings: normalized.flatMap((item) => item.warnings),
  };
}

export const vendorMailGuardLimits = DEFAULT_LIMITS;
