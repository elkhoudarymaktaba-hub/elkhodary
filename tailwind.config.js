/** @type {import('tailwindcss').Config} */
module.exports = {
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
      },
      borderRadius: {
        card: "18px",
        cta: "9999px", // Fully rounded pill buttons
        input: "12px",
        notebook: "26px", // Notebook round edges
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        tajawal: ["var(--font-tajawal)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        brand: "0 20px 40px -18px rgba(14, 51, 80, 0.28)",
        card: "0 8px 20px -10px rgba(14, 51, 80, 0.22)",
        glow: "0 0 20px rgba(140, 100, 32, 0.35)",
        glowLight: "0 0 20px rgba(217, 175, 86, 0.35)",
      },
    },
  },
  plugins: [],
};
