/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ember: {
          50:  '#FDF5E8',
          100: '#FAE4C0',
          200: '#F5CC88',
          300: '#F0A840',
          400: '#E8920A',
          500: '#D4891A',
          600: '#A86512',
          700: '#7A480D',
          800: '#4E2E08',
          900: '#2A1804',
        },
        obsidian: {
          50:  '#F7F3EE',
          100: '#EDE8E0',
          200: '#DDD5C8',
          300: '#C4B5A0',
          400: '#A89880',
          500: '#8C7A68',
          600: '#6E5A48',
          700: '#4E3E30',
          800: '#352A20',
          900: '#2A211A',
          950: '#1C1410',
        },
      },
      fontFamily: {
        sans: ['"thmanyah Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        'display-ar': ['"thmanyah Serif Display"', '"thmanyah Sans"', 'system-ui', 'serif'],
        latin: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
