/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // ← This was empty! Critical fix
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}