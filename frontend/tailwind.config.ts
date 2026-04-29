import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#09090b",
          1: "#111114",
          2: "#18181c",
          3: "#1f1f24",
          4: "#28282e",
        },
        accent: {
          DEFAULT: "#6d5ff5",
          light: "#8b80f7",
          dim: "#4a3fd0",
          glow: "rgba(109, 95, 245, 0.15)",
        },
        success: { DEFAULT: "#22c55e", dim: "#16a34a", glow: "rgba(34,197,94,0.12)" },
        danger: { DEFAULT: "#ef4444", dim: "#dc2626", glow: "rgba(239,68,68,0.12)" },
        warn: { DEFAULT: "#f59e0b", dim: "#d97706", glow: "rgba(245,158,11,0.12)" },
        muted: "#71717a",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
        display: ['"Cabinet Grotesk"', '"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(109, 95, 245, 0.15)",
        "glow-lg": "0 0 40px rgba(109, 95, 245, 0.2)",
        card: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;