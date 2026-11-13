import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0a1b33", 2: "#10284a", 3: "#173659" },
        line: "#27456e",
        ink: "#f4f6fa",
        muted: "#98a8bf",
        gold: "#d4ad55",
        silver: "#b9c2ce",
        bronze: "#b98250",
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Narrow", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  corePlugins: { preflight: false },
  plugins: [],
} satisfies Config;
