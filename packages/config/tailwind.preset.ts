import type { Config } from "tailwindcss";

export const agoraPreset = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      colors: {
        bg: "oklch(0.14 0 0)",
        "bg-elev": "oklch(0.18 0 0)",
        border: "oklch(0.24 0 0)",
        muted: "oklch(0.55 0 0)",
        fg: "oklch(0.96 0 0)",
        accent: "oklch(0.78 0.13 75)",
        success: "oklch(0.72 0.15 145)",
        warning: "oklch(0.78 0.15 75)",
        danger: "oklch(0.65 0.20 25)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      maxWidth: {
        reading: "720px",
        content: "960px",
      },
      letterSpacing: {
        persona: "0.05em",
      },
    },
  },
} satisfies Partial<Config>;
