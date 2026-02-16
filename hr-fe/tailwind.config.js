/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#fdf8f5',
          100: '#f5ebe0',
          200: '#ebd5c3',
          300: '#deb99a',
          400: '#d0966d',
          500: '#c47a4b',
          600: '#b86538',
          700: '#9a4f2e',
          800: '#7f412a',
          900: '#663625',
          950: '#381810',
        },
      },
    },
  },
  plugins: [],
}
