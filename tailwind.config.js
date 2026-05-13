/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060F18',
          900: '#0B1E2D',
          800: '#0D2B3E',
          700: '#123550',
          600: '#1A4366',
        },
        gold: {
          DEFAULT: '#9A7D4A',
          light:   '#C4B49A',
          dark:    '#7A6038',
        },
        cream: {
          DEFAULT: '#EDE3D8',
          light:   '#F5F0E8',
          dark:    '#C4B49A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
