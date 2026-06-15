import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark surfaces (nav, footer, hero, dark cards)
        night: "#141414",
        dark: "#171717",
        coal: "#111111",
        ink: "#161616",
        // Brand accents
        electric: "#0200dd", // numbered headings, "Read More" pill
        orchid: "#b66dc7", // INFINITE wordmark, "Join Us", "Guaranteed"
        mauve: "#9b7bb3", // muted purple subheads (Delivery Proof)
        // Soft surfaces
        lavender: "#c3bff5", // process cards, CTA band, contact bg
        "lavender-soft": "#d3d0f7",
        mist: "#eeedf1", // light grey section bg
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        site: "1280px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 25px) scale(0.95)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        blob: "blob 16s ease-in-out infinite",
        "gradient-pan": "gradient-pan 10s ease infinite",
        marquee: "marquee 30s linear infinite",
        "spin-slow": "spin-slow 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
