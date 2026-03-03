/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // ScreeningCard seat availability badge — dynamically assigned
    'bg-green-100', 'text-green-700',
    'bg-yellow-100', 'text-yellow-700',
    'bg-red-100', 'text-red-700',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}