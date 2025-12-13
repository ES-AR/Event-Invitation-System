/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#111827',
        muted: '#f3f4f6',
        accent: '#111827',
        danger: '#fca5a5'
      },
      boxShadow: {
        card: '0 10px 25px -10px rgba(0,0,0,0.1)'
      }
    },
  },
  plugins: [],
}
