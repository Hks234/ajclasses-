import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "rgb(var(--purple-rgb) / <alpha-value>)",
        deep: "rgb(var(--plum-rgb) / <alpha-value>)",
        royal: "rgb(var(--purple-rgb) / <alpha-value>)",
        orange: "rgb(var(--orange-rgb) / <alpha-value>)",
        cream: "#FFF6EA",
        paper: "#F3F6FB",
        ink: "#222222",
        plum: "rgb(var(--plum-rgb) / <alpha-value>)",
        purple: "rgb(var(--purple-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "Helvetica", "Arial", "Lucida", "sans-serif"],
        display: ["var(--font-poppins)", "Poppins", "Helvetica", "Arial", "sans-serif"],
        serif: ["var(--font-poppins)", "Poppins", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgb(var(--plum-rgb) / 0.08)",
        lift: "0 24px 60px rgb(var(--plum-rgb) / 0.16)",
        nav: "0 0 7px rgba(0,0,0,0.10)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadein: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--orange-rgb) / 0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgb(var(--orange-rgb) / 0)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        rise: "rise 0.7s ease-out both",
        fadein: "fadein 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
