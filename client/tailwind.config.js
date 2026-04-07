/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["General Sans", "Sora", "system-ui", "sans-serif"],
        display: ["Sora", "General Sans", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#dfe9ff",
          200: "#bfd2ff",
          300: "#94b8ff",
          400: "#4d8dff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e3a8a",
          800: "#172554",
          900: "#0b1533",
        },
        slate: {
          900: "#0f172a",
          800: "#1e293b",
          600: "#475569",
          400: "#94a3b8",
          200: "#e2e8f0",
          100: "#f1f5f9",
        },
        success: "#12b981",
        warning: "#f97316",
        danger: "#ef4444",
        muted: "#f5f7fb",
      },
      boxShadow: {
        card: "0 30px 60px -35px rgba(15, 23, 42, 0.4)",
        soft: "0 20px 40px -30px rgba(15, 23, 42, 0.25)",
      },
      borderRadius: {
        xl: "1.25rem",
        '2xl': "1.75rem",
      },
      backgroundImage: {
        'hero-gradient': "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0f172a 100%)",
      },
    },
  },
  plugins: [],
}
