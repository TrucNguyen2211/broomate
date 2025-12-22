// FE/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // ✅ Enable class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
}