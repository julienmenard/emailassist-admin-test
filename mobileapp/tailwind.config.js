/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a2333',
          light: '#293a52',
          dark: '#0f1726'
        },
        accent: {
          DEFAULT: '#10B981',
          light: '#34D399'
        }
      }
    },
  },
  plugins: [],
}