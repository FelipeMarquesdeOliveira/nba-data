/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Status colors (exact from spec)
        live: '#EF4444',      // RED - LIVE
        soon: '#EAB308',      // YELLOW - SOON
        future: '#3B82F6',    // BLUE - FUTURE
        finished: '#6B7280',  // GRAY - FINISHED
        // Prop line colors
        propGreen: '#22C55E', // <= 3 points to beat
        propYellow: '#EAB308', // > 3 and <= 5
        propRed: '#EF4444',    // > 5
        // Dark theme
        dark: {
          900: '#0F0F0F',
          800: '#1A1A1A',
          700: '#262626',
          600: '#333333',
          500: '#404040',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}