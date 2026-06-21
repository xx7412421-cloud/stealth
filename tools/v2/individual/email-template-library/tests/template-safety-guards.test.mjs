import assert from "node:assert/strict";
import test from "node:test";

import {
  collectTemplateVariables,
  estimateTemplateCost,
  sanitizeTemplateText,
  validateTemplateCollection,
  validateTemplateDraft,
} from "../services/template-safety-guards.mjs";
import {
  hostileTemplateDrafts,
  oversizedTemplateDraft,
  safeTemplateDraft,
} from "../fixtures/security-fixtures.mjs";

test("safe template drafts pass validation with deterministic metrics", () => {
  const result = validateTemplateDraft(safeTemplateDraft);

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.metrics.variableCount, 2);
  assert.equal(result.metrics.withinRenderBudget, true);
});

test("unsafe markup and secret-looking content are rejected", () => {
  const results = hostileTemplateDrafts.map((draft) => validateTemplateDraft(draft));

  assert.equal(results.every((result) => result.ok === false), true);
  assert.match(results[0].errors.join(" "), /Active markup/);
  assert.match(results[1].errors.join(" "), /Secret-looking/);
  assert.match(results[2].errors.join(" "), /Active markup/);
});

test("template text is normalized and length-bounded", () => {
  const result = validateTemplateDraft(oversizedTemplateDraft);

  assert.equal(result.ok, true);
  assert.equal(result.normalized.subject.length, 240);
  assert.equal(result.normalized.body.length, 12000);
  assert.equal(result.warnings.length >= 2, true);
});

test("variable extraction reports undeclared placeholders", () => {
  const draft = {
    ...safeTemplateDraft,
    body: "Hello {{firstName}}, please confirm {{missingField}}.",
    variables: [{ key: "firstName", label: "First name" }],
  };
  const result = validateTemplateDraft(draft);

  assert.equal(result.ok, true);
  assert.deepEqual(collectTemplateVariables(draft.subject, draft.body), [
    "firstName",
    "missingField",
  ]);
  assert.match(result.warnings.join(" "), /missingField/);
});

test("collection validation catches duplicates and capacity risk", () => {
  const result = validateTemplateCollection([
    safeTemplateDraft,
    { ...safeTemplateDraft, name: "Duplicate id" },
  ]);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Duplicate template id/);
  assert.equal(result.metrics.uniqueIds, 1);
});

test("sanitization strips invisible and control characters", () => {
  assert.equal(sanitizeTemplateText("\u0000 hello\u200b "), "hello");
});

test("cost estimation stays pure and does not mutate templates", () => {
  const template = structuredClone(safeTemplateDraft);
  const before = JSON.stringify(template);
  const metrics = estimateTemplateCost(template);

  assert.equal(metrics.variableCount, 2);
  assert.equal(JSON.stringify(template), before);
});
