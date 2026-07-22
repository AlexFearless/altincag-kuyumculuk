/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',
          100: '#FDF8EE',
          200: '#F9EDD4',
          300: '#F3DFB0',
          400: '#E8C97A',
          500: '#D4A843',
          600: '#B8912A',
          700: '#8C6D1F',
          800: '#5F4A15',
          900: '#3D2F0E',
        },
        gold: {
          50: '#FFF9E6',
          100: '#FFF0B8',
          200: '#FFE580',
          300: '#FFD740',
          400: '#FFC928',
          500: '#D4A843',
          600: '#B8912A',
          700: '#8C6D1F',
          800: '#5F4A15',
          900: '#3D2F0E',
        },
        earth: {
          50: '#FAF7F2',
          100: '#F0EBE0',
          200: '#E0D5C3',
          300: '#C9B89E',
          400: '#B09A7A',
          500: '#96785A',
          600: '#7A5F42',
          700: '#5E4832',
          800: '#433224',
          900: '#2A1F16',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
