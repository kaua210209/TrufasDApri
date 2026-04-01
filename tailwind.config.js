/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#FDFCFB',
        brand: {
          pink: '#EC4899', // Pink-500
          dark: '#DB2777', // Pink-600
        },
        graphite: '#0F172A', // Slate-900
      }
    },
  },
  plugins: [],
}