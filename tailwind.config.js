/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'f-bg':      '#080d08',
        'f-surface': '#0f160f',
        'f-card':    '#131c13',
        'f-border':  '#1a271a',
        'f-green':   '#16a34a',
        'f-accent':  '#4ade80',
        'f-yellow':  '#fbbf24',
        'f-red':     '#ef4444',
        'f-text':    '#c8e6c8',
        'f-muted':   '#4d6b4d',
        // compat aliases
        'falta-bg':     '#080d08',
        'falta-green':  '#16a34a',
        'falta-accent': '#4ade80',
        'falta-card':   '#131c13',
        'falta-border': '#1a271a',
        'falta-text':   '#c8e6c8',
        'falta-muted':  '#4d6b4d',
      },
      fontFamily: {
        barlow: ['"Barlow Condensed"', 'sans-serif'],
      },
      boxShadow: {
        'green-sm': '0 4px 14px rgba(22,163,74,0.4)',
        'green-lg': '0 0 40px rgba(74,222,128,0.12)',
        'card':     '0 2px 20px rgba(0,0,0,0.6)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        spinCustom: { to: { transform: 'rotate(360deg)' } },
        pulseGreen: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(74,222,128,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(74,222,128,0)' },
        },
      },
      animation: {
        'fade-up':     'fadeUp 0.3s ease-out',
        'slide-up':    'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'spin-custom': 'spinCustom 1s linear infinite',
        'pulse-green': 'pulseGreen 2s infinite',
      },
    },
  },
  plugins: [],
}
