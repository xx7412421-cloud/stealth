const MAX_NAME_LENGTH = 120;
const MAX_SUBJECT_LENGTH = 240;
const MAX_BODY_LENGTH = 12000;
const MAX_VARIABLES = 30;
const MAX_RENDER_OUTPUT_LENGTH = 16000;
const MAX_COLLECTION_SIZE = 250;
const MAX_TOTAL_BODY_LENGTH = 600000;

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const ZERO_WIDTH_PATTERN = /[\u200b-\u200f\ufeff]/g;
const ACTIVE_MARKUP_PATTERN =
  /<\s*(script|iframe|object|embed|form|input|button|textarea|select|link|meta|style)\b|on[a-z]+\s*=|javascript\s*:|data\s*:\s*text\/html/i;
const SECRET_PATTERN =
  /\b(api[_-]?key|private[_-]?key|secret|token|password|seed phrase|mnemonic|bearer)\b\s*[:=]/i;
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_.-]{0,63})\s*\}\}/g;

export function sanitizeTemplateText(value, options = {}) {
  const maxLength = options.maxLength ?? MAX_BODY_LENGTH;
  const normalized = String(value ?? "")
    .normalize("NFC")
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(ZERO_WIDTH_PATTERN, "")
    .replace(/\r\n?/g, "\n")
    .trim();

  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

export function collectTemplateVariables(subject, body) {
  const keys = new Set();
  const source = `${subject}\n${body}`;
  let match;

  while ((match = VARIABLE_PATTERN.exec(source)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys).sort();
}

export function validateTemplateDraft(draft) {
  const errors = [];
  const warnings = [];

  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return {
      ok: false,
      errors: ["Template draft must be an object."],
      warnings: [],
      normalized: null,
      metrics: null,
    };
  }

  const normalized = {
    id: sanitizeTemplateText(draft.id, { maxLength: 80 }),
    name: sanitizeTemplateText(draft.name, { maxLength: MAX_NAME_LENGTH }),
    categoryId:
      draft.categoryId === null || draft.categoryId === undefined
        ? null
        : sanitizeTemplateText(draft.categoryId, { maxLength: 80 }),
    subject: sanitizeTemplateText(draft.subject, {
      maxLength: MAX_SUBJECT_LENGTH,
    }),
    body: sanitizeTemplateText(draft.body, { maxLength: MAX_BODY_LENGTH }),
    variables: Array.isArray(draft.variables) ? draft.variables.slice(0, MAX_VARIABLES) : [],
  };

  if (!normalized.id) {
    errors.push("Template id is required.");
  }

  if (!normalized.name) {
    errors.push("Template name is required.");
  }

  if (!normalized.subject && !normalized.body) {
    errors.push("Template subject or body is required.");
  }

  const combinedText = `${normalized.subject}\n${normalized.body}`;

  if (ACTIVE_MARKUP_PATTERN.test(combinedText)) {
    errors.push("Active markup and executable content are not allowed in templates.");
  }

  if (SECRET_PATTERN.test(combinedText)) {
    errors.push("Secret-looking values must not be stored in reusable templates.");
  }

  if (String(draft.name ?? "").length > MAX_NAME_LENGTH) {
    warnings.push("Template name was clipped to the maximum supported length.");
  }

  if (String(draft.subject ?? "").length > MAX_SUBJECT_LENGTH) {
    warnings.push("Template subject was clipped to the maximum supported length.");
  }

  if (String(draft.body ?? "").length > MAX_BODY_LENGTH) {
    warnings.push("Template body was clipped to the maximum supported length.");
  }

  const referencedVariables = collectTemplateVariables(normalized.subject, normalized.body);
  const declaredVariables = normalized.variables
    .map((variable) => sanitizeTemplateText(variable?.key, { maxLength: 64 }))
    .filter(Boolean);
  const missingDeclarations = referencedVariables.filter(
    (key) => !declaredVariables.includes(key),
  );

  if (missingDeclarations.length > 0) {
    warnings.push(
      `Template references undeclared variables: ${missingDeclarations.join(", ")}.`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalized,
    metrics: estimateTemplateCost(normalized),
  };
}

export function estimateTemplateCost(template) {
  const subject = String(template?.subject ?? "");
  const body = String(template?.body ?? "");
  const variables = collectTemplateVariables(subject, body);

  return {
    subjectLength: subject.length,
    bodyLength: body.length,
    variableCount: variables.length,
    estimatedRenderLength: subject.length + body.length,
    withinRenderBudget: subject.length + body.length <= MAX_RENDER_OUTPUT_LENGTH,
  };
}

export function validateTemplateCollection(templates) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(templates)) {
    return {
      ok: false,
      errors: ["Template collection must be an array."],
      warnings: [],
      metrics: null,
    };
  }

  if (templates.length > MAX_COLLECTION_SIZE) {
    errors.push(`Template collection exceeds ${MAX_COLLECTION_SIZE} items.`);
  }

  const ids = new Set();
  let totalBodyLength = 0;

  for (const template of templates) {
    const result = validateTemplateDraft(template);

    if (!result.ok) {
      errors.push(...result.errors.map((error) => `${template?.id ?? "unknown"}: ${error}`));
    }

    if (result.normalized?.id) {
      if (ids.has(result.normalized.id)) {
        errors.push(`Duplicate template id: ${result.normalized.id}.`);
      }

      ids.add(result.normalized.id);
    }

    totalBodyLength += String(template?.body ?? "").length;
  }

  if (totalBodyLength > MAX_TOTAL_BODY_LENGTH) {
    errors.push(`Template collection body text exceeds ${MAX_TOTAL_BODY_LENGTH} characters.`);
  }

  if (templates.length > 100) {
    warnings.push("Large template collections should use indexed search in future integration.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics: {
      count: templates.length,
      totalBodyLength,
      uniqueIds: ids.size,
      maxItems: MAX_COLLECTION_SIZE,
    },
  };
}
