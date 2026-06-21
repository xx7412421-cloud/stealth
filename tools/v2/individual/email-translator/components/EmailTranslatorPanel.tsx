"use client";

import { FormEvent, useId, useMemo, useState } from "react";

type TranslationStatus = "empty" | "loading" | "success" | "error";

const languageOptions = [
  "Auto-detect",
  "English",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Korean",
  "Chinese",
];

const maxEmailChars = 12000;

function buildPreview(sourceText: string, targetLanguage: string, preserveTone: boolean) {
  const normalized = sourceText.trim().replace(/\s+/g, " ");
  const excerpt = normalized.length > 220 ? `${normalized.slice(0, 220)}...` : normalized;
  const toneNote = preserveTone ? "Tone preserved" : "Neutral tone";

  return `[${targetLanguage}] ${excerpt}\n\n${toneNote}. Review names, dates, currency, links, and any legal or medical wording before sending.`;
}

export default function EmailTranslatorPanel() {
  const sourceId = useId();
  const targetId = useId();
  const messageId = useId();
  const statusId = useId();
  const resultId = useId();
  const [sourceLanguage, setSourceLanguage] = useState("Auto-detect");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [sourceText, setSourceText] = useState("");
  const [preserveTone, setPreserveTone] = useState(true);
  const [status, setStatus] = useState<TranslationStatus>("empty");
  const [translatedText, setTranslatedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const remainingCharacters = maxEmailChars - sourceText.length;
  const statusCopy = useMemo(() => {
    if (status === "loading") return "Preparing translation preview...";
    if (status === "success") return "Translation preview ready.";
    if (status === "error") return errorMessage;
    return "Paste an email to prepare a translation preview.";
  }, [errorMessage, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceText.trim()) {
      setStatus("error");
      setErrorMessage("Paste an email before translating.");
      setTranslatedText("");
      return;
    }

    if (sourceText.length > maxEmailChars) {
      setStatus("error");
      setErrorMessage(`Email is ${Math.abs(remainingCharacters)} characters over the local review limit.`);
      setTranslatedText("");
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setStatus("error");
      setErrorMessage("Choose a different target language.");
      setTranslatedText("");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    await Promise.resolve();
    setTranslatedText(buildPreview(sourceText, targetLanguage, preserveTone));
    setStatus("success");
  }

  function handleReset() {
    setSourceText("");
    setTranslatedText("");
    setErrorMessage("");
    setStatus("empty");
  }

  return (
    <section
      aria-labelledby={targetId}
      className="email-translator-panel"
      data-tool="email-translator"
    >
      <div className="email-translator-panel__header">
        <p className="email-translator-panel__eyebrow">Individual email tool</p>
        <h2 id={targetId}>Email Translator</h2>
        <p>
          Translate an email draft locally before a future integration connects this
          panel to a translation service.
        </p>
      </div>

      <form className="email-translator-panel__grid" onSubmit={handleSubmit}>
        <div className="email-translator-panel__controls" aria-describedby={messageId}>
          <label>
            Source language
            <select
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
            >
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>

          <label>
            Target language
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            >
              {languageOptions
                .filter((language) => language !== "Auto-detect")
                .map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
            </select>
          </label>

          <label className="email-translator-panel__checkbox">
            <input
              checked={preserveTone}
              onChange={(event) => setPreserveTone(event.target.checked)}
              type="checkbox"
            />
            Preserve sender tone
          </label>
        </div>

        <label className="email-translator-panel__source" htmlFor={sourceId}>
          Email body
          <textarea
            aria-describedby={`${messageId} ${statusId}`}
            id={sourceId}
            maxLength={maxEmailChars + 500}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Paste the email text to translate."
            rows={10}
            value={sourceText}
          />
        </label>

        <p id={messageId} className="email-translator-panel__hint">
          Maximum local preview size: {maxEmailChars.toLocaleString()} characters.
          {remainingCharacters >= 0
            ? ` ${remainingCharacters.toLocaleString()} remaining.`
            : ` ${Math.abs(remainingCharacters).toLocaleString()} over the limit.`}
        </p>

        <div className="email-translator-panel__actions">
          <button disabled={status === "loading"} type="submit">
            {status === "loading" ? "Translating..." : "Translate email"}
          </button>
          <button onClick={handleReset} type="button">
            Clear
          </button>
        </div>
      </form>

      <div
        aria-live="polite"
        className={`email-translator-panel__status email-translator-panel__status--${status}`}
        id={statusId}
        role={status === "error" ? "alert" : "status"}
      >
        {statusCopy}
      </div>

      <article
        aria-labelledby={resultId}
        className="email-translator-panel__result"
        tabIndex={0}
      >
        <h3 id={resultId}>Translation preview</h3>
        {translatedText ? (
          <pre>{translatedText}</pre>
        ) : (
          <p>No translation preview yet.</p>
        )}
      </article>
    </section>
  );
}
