/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        handwriting: ['"Patrick Hand"', 'cursive'],
        arabic: ['"Tajawal"', 'sans-serif'],
      },
      colors: {
        paper: '#fdfbf7',
        ink: '#1a1a1a',
        gold: '#d4af37',
      }
    },
  },
  plugins: [],
}
