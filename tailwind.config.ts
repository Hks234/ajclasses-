import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#102A56",
        deep: "#081B38",
        royal: "#2456A6",
        orange: "#FF7900",
        cream: "#FFF0E4",
        paper: "#F5F7FB",
        ink: "#17243A",
      },
      fontFamily: {
        sans: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(16, 42, 86, 0.08)",
        lift: "0 24px 60px rgba(16, 42, 86, 0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
