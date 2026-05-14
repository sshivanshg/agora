"use client";

export type TheaterMode = "watch" | "read";

export const THEATER_MODE_STORAGE_KEY = "agora.debate-mode";

function persistMode(mode: TheaterMode) {
  try {
    window.localStorage.setItem(THEATER_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage may be unavailable (private mode, etc.) — ignore
  }
}

interface TheaterModeToggleProps {
  mode: TheaterMode;
  onModeChange: (mode: TheaterMode) => void;
}

export function TheaterModeToggle({ mode, onModeChange }: TheaterModeToggleProps) {
  const handle = (next: TheaterMode) => {
    persistMode(next);
    onModeChange(next);
  };
  return (
    <div className="theater-toggle" role="tablist" aria-label="Debate view mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "watch"}
        data-active={mode === "watch"}
        className="theater-toggle-option"
        onClick={() => handle("watch")}
      >
        Watch
      </button>
      <span className="theater-toggle-sep" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "read"}
        data-active={mode === "read"}
        className="theater-toggle-option"
        onClick={() => handle("read")}
      >
        Read
      </button>
    </div>
  );
}
