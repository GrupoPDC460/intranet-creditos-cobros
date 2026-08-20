import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A1230",
          900: "#080E26",
          800: "#0A1230",
          700: "#0E1A44",
          600: "#132258",
        },
        brand: {
          DEFAULT: "#2456E6",
          50: "#EAF0FF",
          400: "#5B84F0",
          500: "#2456E6",
          600: "#1D45BD",
          glow: "#4CC9F0",
        },
        gold: {
          DEFAULT: "#F5A623",
          soft: "#FFCB6B",
        },
        line: "rgba(148,163,214,0.14)",
        muted: "#9AA6C7",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.375rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 30px -12px rgba(3,7,25,0.7)",
        "glass-lg": "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 24px 60px -20px rgba(3,7,25,0.85)",
        glow: "0 0 0 1px rgba(76,201,240,0.25), 0 8px 40px -8px rgba(36,86,230,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.06)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        drift: "drift 22s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
