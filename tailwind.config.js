/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maya: {
          bg: '#090b10',
          surface: '#121622',
          surfaceHover: '#1b2133',
          gold: '#d4af37',
          goldLight: '#f3e5ab',
          goldDark: '#8b6b23',
          text: '#e6dfd3',
          textDim: '#a39e93',
          // Lit text cream — used for headings / active callouts that need to
          // read brighter than `text` (which sits in the bone/parchment range).
          cream: '#f5ecd7'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
