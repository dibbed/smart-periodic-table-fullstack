/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        quantum: {
          bg: '#050814',
          card: '#0c1226',
          border: '#1e293b',
          neonCyan: '#00f0ff',
          neonPink: '#ff007f',
          neonGold: '#ffb703',
          neonEmerald: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
