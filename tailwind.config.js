/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Escala principal — Verde Bosque
        bosque: {
          950: '#0E1A0A',
          900: '#1C2A17',
          800: '#243520',
          700: '#2E4228',
          600: '#3D5C34',
        },
        // Alias navy → bosque (compatibilidad con clases existentes)
        navy: {
          950: '#0E1A0A',
          900: '#1C2A17',
          800: '#243520',
          700: '#2E4228',
          600: '#3D5C34',
        },
        // Acento tierra / sage
        gold: {
          DEFAULT: '#9A7D45',
          light:   '#B8C89A',
          dark:    '#7A6235',
        },
        tierra: {
          DEFAULT: '#9A7D45',
          light:   '#B8C89A',
          dark:    '#7A6235',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          light:   '#F5F0E8',
          dark:    '#E8E4DC',
        },
        // Verde Salvia — usado como `text-sage`, `bg-sage`, etc.
        sage: '#8B9E6E',
        // Azul Agua — acento secundario
        agua: '#2B7A8C',
        // Alias para CoordPicker (dev tool)
        forest: {
          900: '#1C2A17',
          800: '#243520',
        },
        moss: '#8B9E6E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
