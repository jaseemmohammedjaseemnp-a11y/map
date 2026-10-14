/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#174C3C',
          brand: '#174C3C',
          950: '#06130d',
          900: '#0c2b21',
          850: '#11291f',
          800: '#174C3C',
          700: '#1f5947',
          600: '#2b6f59',
          500: '#3c886e',
          400: '#539e7d',
          300: '#75bfa0',
          200: '#a3d9c3',
          100: '#d5eee3',
          50: '#f0f9f5',
        },
        cream: {
          DEFAULT: '#FFF8ED',
          warm: '#FFF8ED',
          950: '#2b2319',
          900: '#473a2a',
          800: '#6d5a42',
          700: '#957c5d',
          600: '#b89d7b',
          500: '#cbb396',
          400: '#decbb4',
          300: '#ebdcc7',
          200: '#f5ecdc',
          100: '#fbf7ee',
          50: '#fefcf8',
        },
        alarm: {
          red: '#ff3b30',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
        mint: {
          300: '#34f5a3',
          400: '#10e68d',
          500: '#00f090',
          600: '#05c977',
          glow: 'rgba(0, 240, 144, 0.45)',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar': 'radarWave 2.5s ease-out infinite',
        'alarm-flash': 'alarmFlash 0.8s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'aura-ripple': 'auraRipple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        radarWave: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        alarmFlash: {
          '0%': { backgroundColor: '#11291f' },
          '100%': { backgroundColor: '#7f1d1d' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 25px rgba(0, 240, 144, 0.4), 0 0 50px rgba(0, 240, 144, 0.2)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 35px rgba(0, 240, 144, 0.65), 0 0 70px rgba(0, 240, 144, 0.35)',
            transform: 'scale(1.015)',
          },
        },
        auraRipple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.35)', opacity: '0.2' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
