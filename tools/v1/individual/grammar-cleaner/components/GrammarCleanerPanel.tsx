"use client";

import { FormEvent, useId, useMemo, useState } from "react";

type CleanerStatus = "empty" | "loading" | "success" | "error";
type CleanupMode = "light" | "standard" | "concise";

const maxDraftChars = 10000;

const cleanupModes: Array<{ label: string; value: CleanupMode }> = [
  { label: "Light grammar pass", value: "light" },
  { label: "Standard cleanup", value: "standard" },
  { label: "Concise rewrite", value: "concise" },
];

const commonCorrections: Array<[RegExp, string]> = [
  [/\bteh\b/gi, "the"],
  [/\brecieve\b/gi, "receive"],
  [/\badress\b/gi, "address"],
  [/\bseperate\b/gi, "separate"],
  [/\boccured\b/gi, "occurred"],
];

function sentenceCase(text: string) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`,
  );
}

function ensureTerminalPunctuation(text: string) {
  if (!text) return text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function buildGrammarPreview(
  draftText: string,
  cleanupMode: CleanupMode,
  preserveTone: boolean,
) {
  let cleaned = draftText.trim().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");

  for (const [pattern, replacement] of commonCorrections) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = sentenceCase(cleaned);

  if (cleanupMode !== "light") {
    cleaned = cleaned
      .replace(/\bkindly please\b/gi, "please")
      .replace(/\bas soon as possible\b/gi, "soon")
      .replace(/\bin order to\b/gi, "to");
  }

  if (cleanupMode === "concise") {
    cleaned = cleaned
      .split(/\n+/)
      .map((line) => ensureTerminalPunctuation(line.trim()))
      .filter(Boolean)
      .join("\n");
  }

  const toneNote = preserveTone
    ? "Tone preserved; review names, deadlines, numbers, and commitments before sending."
    : "Neutral tone applied; review relationship-sensitive wording before sending.";

  return `${cleaned}\n\n${toneNote}`;
}

export default function GrammarCleanerPanel() {
  const titleId = useId();
  const draftId = useId();
  const modeId = useId();
  const hintId = useId();
  const statusId = useId();
  const resultId = useId();

  const [draftText, setDraftText] = useState("");
  const [cleanupMode, setCleanupMode] = useState<CleanupMode>("standard");
  const [preserveTone, setPreserveTone] = useState(true);
  const [status, setStatus] = useState<CleanerStatus>("empty");
  const [resultText, setResultText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const remainingCharacters = maxDraftChars - draftText.length;
  const statusCopy = useMemo(() => {
    if (status === "loading") return "Preparing grammar-cleaned preview...";
    if (status === "success") return "Grammar-cleaned preview ready.";
    if (status === "error") return errorMessage;
    return "Paste a draft to prepare a grammar-cleaned preview.";
  }, [errorMessage, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftText.trim()) {
      setStatus("error");
      setErrorMessage("Paste an email draft before cleaning grammar.");
      setResultText("");
      return;
    }

    if (draftText.length > maxDraftChars) {
      setStatus("error");
      setErrorMessage(
        `Draft is ${Math.abs(remainingCharacters).toLocaleString()} characters over the local review limit.`,
      );
      setResultText("");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    await Promise.resolve();
    setResultText(buildGrammarPreview(draftText, cleanupMode, preserveTone));
    setStatus("success");
  }

  function handleReset() {
    setDraftText("");
    setResultText("");
    setErrorMessage("");
    setStatus("empty");
  }

  return (
    <section
      aria-labelledby={titleId}
      className="grammar-cleaner-panel"
      data-tool="grammar-cleaner"
    >
      <div className="grammar-cleaner-panel__header">
        <p className="grammar-cleaner-panel__eyebrow">Individual email tool</p>
        <h2 id={titleId}>Grammar Cleaner</h2>
        <p>
          Clean grammar, punctuation, and clarity issues in a draft before a
          future integration connects this panel to live mail data.
        </p>
      </div>

      <form className="grammar-cleaner-panel__grid" onSubmit={handleSubmit}>
        <label className="grammar-cleaner-panel__source" htmlFor={draftId}>
          Email draft
          <textarea
            aria-describedby={`${hintId} ${statusId}`}
            id={draftId}
            maxLength={maxDraftChars + 500}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder="Paste the email draft to clean."
            rows={10}
            value={draftText}
          />
        </label>

        <div className="grammar-cleaner-panel__controls">
          <label htmlFor={modeId}>
            Cleanup level
            <select
              id={modeId}
              onChange={(event) => setCleanupMode(event.target.value as CleanupMode)}
              value={cleanupMode}
            >
              {cleanupModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grammar-cleaner-panel__checkbox">
            <input
              checked={preserveTone}
              onChange={(event) => setPreserveTone(event.target.checked)}
              type="checkbox"
            />
            Preserve the sender's tone
          </label>
        </div>

        <p className="grammar-cleaner-panel__hint" id={hintId}>
          Maximum local preview size: {maxDraftChars.toLocaleString()} characters.
          {remainingCharacters >= 0
            ? ` ${remainingCharacters.toLocaleString()} remaining.`
            : ` ${Math.abs(remainingCharacters).toLocaleString()} over the limit.`}
        </p>

        <div className="grammar-cleaner-panel__actions">
          <button disabled={status === "loading"} type="submit">
            {status === "loading" ? "Cleaning..." : "Clean grammar"}
          </button>
          <button onClick={handleReset} type="button">
            Clear
          </button>
        </div>
      </form>

      <div
        aria-live="polite"
        className={`grammar-cleaner-panel__status grammar-cleaner-panel__status--${status}`}
        id={statusId}
        role={status === "error" ? "alert" : "status"}
      >
        {statusCopy}
      </div>

      <article
        aria-labelledby={resultId}
        className="grammar-cleaner-panel__result"
        tabIndex={0}
      >
        <h3 id={resultId}>Cleaned preview</h3>
        {resultText ? <pre>{resultText}</pre> : <p>No cleaned preview yet.</p>}
      </article>
    </section>
  );
}
