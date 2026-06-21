import type { DeadlineMessage, DeadlineSourceType } from "../types";

export interface DeadlineInputLimits {
  maxMessages: number;
  maxIdChars: number;
  maxSenderChars: number;
  maxSubjectChars: number;
  maxBodyChars: number;
  maxTimezoneChars: number;
}

export interface DeadlineInputGuardOptions extends Partial<DeadlineInputLimits> {
  defaultTimezone?: string;
}

export const DEADLINE_INPUT_LIMITS: DeadlineInputLimits = Object.freeze({
  maxMessages: 50,
  maxIdChars: 80,
  maxSenderChars: 160,
  maxSubjectChars: 240,
  maxBodyChars: 12000,
  maxTimezoneChars: 80,
});

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const WHITESPACE_PATTERN = /[ \t]+/g;
const SOURCE_TYPES: ReadonlySet<DeadlineSourceType> = new Set([
  "calendar-forward",
  "email",
  "invoice",
  "project-update",
]);

function resolveLimits(options: DeadlineInputGuardOptions): DeadlineInputLimits {
  return {
    maxMessages: options.maxMessages ?? DEADLINE_INPUT_LIMITS.maxMessages,
    maxIdChars: options.maxIdChars ?? DEADLINE_INPUT_LIMITS.maxIdChars,
    maxSenderChars: options.maxSenderChars ?? DEADLINE_INPUT_LIMITS.maxSenderChars,
    maxSubjectChars: options.maxSubjectChars ?? DEADLINE_INPUT_LIMITS.maxSubjectChars,
    maxBodyChars: options.maxBodyChars ?? DEADLINE_INPUT_LIMITS.maxBodyChars,
    maxTimezoneChars: options.maxTimezoneChars ?? DEADLINE_INPUT_LIMITS.maxTimezoneChars,
  };
}

export function cleanDeadlineText(value: unknown, maxChars: number): string {
  return typeof value === "string"
    ? value
        .replace(CONTROL_CHAR_PATTERN, "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.replace(WHITESPACE_PATTERN, " ").trim())
        .join("\n")
        .trim()
        .slice(0, maxChars)
    : "";
}

function normalizeSourceType(value: unknown): DeadlineSourceType {
  return SOURCE_TYPES.has(value as DeadlineSourceType)
    ? (value as DeadlineSourceType)
    : "email";
}

export function normalizeDeadlineMessages(
  messages: DeadlineMessage[],
  options: DeadlineInputGuardOptions = {},
): DeadlineMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const limits = resolveLimits(options);
  const defaultTimezone = cleanDeadlineText(options.defaultTimezone, limits.maxTimezoneChars) || "UTC";

  return messages.slice(0, limits.maxMessages).map((message, index) => {
    const source =
      message && typeof message === "object" && !Array.isArray(message)
        ? (message as Partial<DeadlineMessage>)
        : {};

    return {
      id: cleanDeadlineText(source.id, limits.maxIdChars) || `message-${index + 1}`,
      type: normalizeSourceType(source.type),
      sender: cleanDeadlineText(source.sender, limits.maxSenderChars),
      subject: cleanDeadlineText(source.subject, limits.maxSubjectChars),
      body: cleanDeadlineText(source.body, limits.maxBodyChars),
      receivedAt: cleanDeadlineText(source.receivedAt, 40),
      containsPersonalData: source.containsPersonalData === true,
      userTimezone:
        cleanDeadlineText(source.userTimezone, limits.maxTimezoneChars) || defaultTimezone,
    };
  });
}
