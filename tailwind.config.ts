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
          DEFAULT: "#041338",
          900: "#030A22",
          800: "#041338",
          700: "#00216F",
          600: "#0A2C7A",
        },
        brand: {
          DEFAULT: "#FF5100",
          50: "#FFF0E8",
          400: "#FF7A3C",
          500: "#FF5100",
          600: "#D94400",
          glow: "#7DBFE6",
        },
        gold: {
          DEFAULT: "#F3B24E",
          soft: "#FFCB6B",
        },
        line: "rgba(148,163,214,0.14)",
        muted: "#9FB0CF",
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
        glow: "0 0 0 1px rgba(125,191,230,0.25), 0 8px 40px -8px rgba(255,81,0,0.4)",
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
