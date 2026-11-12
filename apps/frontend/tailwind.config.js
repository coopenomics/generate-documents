/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-golos)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-literata)', 'Georgia', 'serif'],
      },
      colors: {
        // Палитра главной страницы: бумага, чернила, зелень печати, жёлтый маркер полей
        paper: '#F6F3EC',
        sheet: '#FFFDF8',
        ink: '#1C1B19',
        graphite: '#5E5A52',
        rule: '#E3DDD0',
        seal: { DEFAULT: '#1F5B3F', dark: '#17452F' },
        marker: '#FFE36E',
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
} 