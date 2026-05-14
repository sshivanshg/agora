"use client";
import { useEffect, useRef, useState } from "react";

export interface TheaterSpeechProps {
  speakerLabel?: string | undefined;
  body?: string | undefined;
  resolution?: string | undefined;
  turn?: number | undefined;
  totalTurns?: number | undefined;
  tokens?: number | undefined;
  /** When true, show a blinking cursor */
  showCursor?: boolean | undefined;
  reduceMotion?: boolean | undefined;
  /** When true, the body text is being streamed; reveal it in word-sized chunks */
  isStreaming?: boolean | undefined;
}

const DEFAULT_BODY =
  "Both prior speakers are arguing about the wrong question. The genuine constraint isn't ideology — it's that we have not measured what actually changes when sortition replaces election in a real legislative chamber.";

export function TheaterSpeech({
  speakerLabel = "NOW SPEAKING · THE TECHNOCRAT",
  body = DEFAULT_BODY,
  resolution = "sortition",
  turn = 7,
  totalTurns = 16,
  tokens = 847,
  showCursor = true,
  reduceMotion = false,
  isStreaming = false,
}: TheaterSpeechProps) {
  const [displayedText, setDisplayedText] = useState<string>(isStreaming ? "" : body);
  const queueRef = useRef<string>("");
  const timerRef = useRef<number | null>(null);
  // Track when speaker changes so we can reset
  const bodyRef = useRef<string>(body);

  // Reset when body is reset to empty or speaker change shortens the body
  useEffect(() => {
    if (body.length < bodyRef.current.length) {
      // New turn or reset
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      queueRef.current = "";
      setDisplayedText(isStreaming ? "" : body);
    }
    bodyRef.current = body;
  }, [body, isStreaming]);

  useEffect(() => {
    // Respect reduced motion or not-streaming: show full text immediately
    if (!isStreaming || reduceMotion) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      queueRef.current = "";
      setDisplayedText(body);
      return;
    }
    const alreadyQueuedOrShown = displayedText.length + queueRef.current.length;
    const newSuffix = body.slice(alreadyQueuedOrShown);
    if (newSuffix) queueRef.current += newSuffix;
    if (timerRef.current !== null) return;

    const tick = () => {
      const pending = queueRef.current;
      if (!pending) {
        timerRef.current = null;
        return;
      }
      // Split by whitespace runs so we can take whole words plus their trailing space
      const tokensArr = pending.split(/(\s+)/);
      // Take 2, 4, or 6 word/space tokens
      const take = Math.min(tokensArr.length, 2 + Math.floor(Math.random() * 3) * 2);
      const chunk = tokensArr.slice(0, take).join("");
      queueRef.current = tokensArr.slice(take).join("");
      setDisplayedText((prev) => prev + chunk);
      timerRef.current = window.setTimeout(tick, 60 + Math.random() * 20);
    };
    timerRef.current = window.setTimeout(tick, 60);
  }, [body, isStreaming, reduceMotion, displayedText.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const cursorVisible =
    showCursor && (isStreaming || queueRef.current.length > 0 || displayedText.length === 0);
  const cursorClass = reduceMotion
    ? "theater-speech-cursor"
    : "theater-speech-cursor theater-cursor";

  return (
    <div className="theater-speech">
      <div className="theater-speech-eyebrow">{speakerLabel}</div>
      <p className="theater-speech-body" aria-live="polite" aria-atomic="false">
        {displayedText}
        {cursorVisible ? <span className={cursorClass} aria-hidden="true" /> : null}
      </p>
      <div className="theater-speech-meta">
        <span>RESOLUTION · {resolution}</span>
        <span>
          TURN {turn} OF ~{totalTurns} · {tokens} TOKENS
        </span>
      </div>
    </div>
  );
}
