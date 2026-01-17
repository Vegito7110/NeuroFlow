/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'darkBrown':'#38240D',
        'lightBrown':'#713600',
        'beige':'#FDFBD4',
        'offWhite':'#F5F5DC',
      }
    },
  },
  plugins: [],
}
