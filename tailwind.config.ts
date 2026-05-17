import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: {
          DEFAULT: "var(--accent)",
          50: "#FFF8E1",
          100: "#FFE7A8",
          500: "#F4B000",
          600: "#D99900",
          700: "#B37B00"
        },
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        app: {
          bg: "#FFFFFF",
          surface: "#FFFFFF",
          surfaceMuted: "#F7F7F7",
          surfaceStrong: "#EEF0F3",
          border: "#DEE1E6",
          borderStrong: "#C7CDD6",
          text: "#0A0B0D",
          textMuted: "#475569",
          textSoft: "#64748B",
          placeholder: "#A8ACB3",
          dark: "#0A0B0D",
          darkElevated: "#16181C"
        },
        brand: {
          50: "#EAF0FF",
          100: "#D6E1FF",
          200: "#A8B8CC",
          300: "#7EA0FF",
          400: "#2A6BFF",
          500: "#0052FF",
          600: "#0052FF",
          700: "#003ECC",
          800: "#0034AC",
          900: "#002A85"
        },
        semantic: {
          up: "#05B169",
          down: "#CF202F"
        }
      }
    }
  },
  plugins: []
};

export default config;
