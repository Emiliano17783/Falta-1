/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Negro + Celeste uruguayo
        'f-bg':      '#0c0c0c',
        'f-surface': '#141414',
        'f-card':    '#1c1c1c',
        'f-border':  '#2a2a2a',
        'f-green':   '#0ea5e9',   // Celeste (botones principales)
        'f-accent':  '#54b5f0',   // Celeste claro (acento)
        'f-yellow':  '#fbbf24',
        'f-red':     '#ef4444',
        'f-text':    '#f2f5eb',
        'f-muted':   '#5a5a5a',
        // compat aliases
        'falta-bg':     '#0c0c0c',
        'falta-green':  '#0ea5e9',
        'falta-accent': '#54b5f0',
        'falta-card':   '#1c1c1c',
        'falta-border': '#2a2a2a',
        'falta-text':   '#f2f5eb',
        'falta-muted':  '#5a5a5a',
      },
      fontFamily: {
        // TIPOGRAFÍA ANTERIOR — descomentar para volver a Oswald + Poppins:
        // barlow: ['Oswald', 'Poppins', 'sans-serif'],

        // TIPOGRAFÍA ANTERIOR — descomentar para volver a Exo 2:
        // barlow: ['"Exo 2"', 'sans-serif'],

        // TIPOGRAFÍA ANTERIOR — descomentar para volver a Barlow Condensed:
        // barlow: ['"Barlow Condensed"', 'sans-serif'],

        // TIPOGRAFÍA ANTERIOR — descomentar para volver a Teko:
        // barlow: ['Teko', 'sans-serif'],

        // TIPOGRAFÍA ACTUAL: Space Grotesk
        barlow: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'lime-sm':  '0 4px 20px rgba(84,181,240,0.25)',
        'lime-lg':  '0 0 60px rgba(84,181,240,0.1)',
        'green-sm': '0 4px 14px rgba(14,165,233,0.4)',
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
          '0%,100%': { boxShadow: '0 0 0 0 rgba(84,181,240,0.4)' },
          '50%':     { boxShadow: '0 0 0 10px rgba(84,181,240,0)' },
        },
        pulseGreen: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(14,165,233,0)' },
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
