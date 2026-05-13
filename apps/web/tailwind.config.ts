import { agoraPreset } from "@agora/config/tailwind";
import type { Config } from "tailwindcss";

export default {
  presets: [agoraPreset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  darkMode: "class",
} satisfies Config;
