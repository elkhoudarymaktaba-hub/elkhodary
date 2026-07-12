import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          muted: "var(--ink-muted)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          line: "var(--paper-line)",
          dark: "var(--paper-dark)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          deep: "var(--amber-deep)",
          light: "var(--amber-light)",
        },
        coral: {
          DEFAULT: "var(--coral)",
          deep: "var(--coral-deep)",
          light: "var(--coral-light)",
        },
        sage: {
          DEFAULT: "var(--sage)",
          deep: "var(--sage-deep)",
          light: "var(--sage-light)",
        },
        plum: {
          DEFAULT: "var(--plum)",
          light: "var(--plum-light)",
        },
        white: "var(--white)",

        // Fallbacks for primary/secondary/brand references
        primary: {
          DEFAULT: "var(--ink)",
          hover: "var(--ink-soft)",
        },
        secondary: {
          DEFAULT: "var(--amber)",
          hover: "var(--amber-deep)",
        },
        accent: {
          DEFAULT: "var(--coral)",
          hover: "var(--coral-deep)",
        },
        brand: {
          bg: "var(--paper)",
          surface: "var(--white)",
          text: "var(--ink)",
          border: "var(--paper-line)",
        },
      },
      borderRadius: {
        card: "16px",
        cta: "24px",
        input: "12px",
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        tajawal: ["var(--font-tajawal)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        premium: "0 8px 24px -10px rgba(22, 35, 63, 0.18), 0 16px 34px -12px rgba(22, 35, 63, 0.24)",
        brand: "0 4px 24px rgba(22, 35, 63, 0.08)",
        card: "0 10px 30px -5px rgba(22, 35, 63, 0.05), 0 4px 15px -5px rgba(22, 35, 63, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
