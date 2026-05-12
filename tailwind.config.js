/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Appito-inspired dark palette
        'f-bg':      '#0c0c0c',   // Ultra dark background
        'f-surface': '#141414',   // Surface / nav
        'f-card':    '#1c1c1c',   // Card background
        'f-border':  '#2a2a2a',   // Borders
        'f-green':   '#16a34a',   // Functional green (buttons)
        'f-accent':  '#c4f54b',   // Appito neon lime ★
        'f-yellow':  '#fbbf24',
        'f-red':     '#ef4444',
        'f-text':    '#f2f5eb',   // Light text
        'f-muted':   '#5a5a5a',   // Muted text
        // compat aliases
        'falta-bg':     '#0c0c0c',
        'falta-green':  '#16a34a',
        'falta-accent': '#c4f54b',
        'falta-card':   '#1c1c1c',
        'falta-border': '#2a2a2a',
        'falta-text':   '#f2f5eb',
        'falta-muted':  '#5a5a5a',
      },
      fontFamily: {
        barlow: ['Inter', '"Barlow Condensed"', 'sans-serif'],
      },
      boxShadow: {
        'lime-sm':  '0 4px 20px rgba(196,245,75,0.25)',
        'lime-lg':  '0 0 60px rgba(196,245,75,0.1)',
        'green-sm': '0 4px 14px rgba(22,163,74,0.4)',
        'card':     '0 2px 24px rgba(0,0,0,0.8)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        spinCustom: { to: { transform: 'rotate(360deg)' } },
        pulseLime: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(196,245,75,0.4)' },
          '50%':     { boxShadow: '0 0 0 10px rgba(196,245,75,0)' },
        },
        pulseGreen: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(74,222,128,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(74,222,128,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':     'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'spin-custom': 'spinCustom 1s linear infinite',
        'pulse-lime':  'pulseLime 2s infinite',
        'pulse-green': 'pulseGreen 2s infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
