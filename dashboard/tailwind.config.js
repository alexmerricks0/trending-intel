/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#101010',
        'surface-raised': '#161616',
        border: '#1e1e1e',
        'border-accent': '#2a2a2a',
        text: '#d4d4d4',
        'text-secondary': '#737373',
        'text-dim': '#525252',
        accent: '#c9a227',
        'accent-soft': 'rgba(201, 162, 39, 0.12)',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
