/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Roboto', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1a73e8',
          dark: '#174ea6',
          bg: '#e8f0fe',
        },
        surface: {
          DEFAULT: '#ffffff',
          2: '#f8f9fa',
          3: '#f1f3f4',
        },
        border: '#dadce0',
        highlight: '#f7cb4d',
        status: {
          pass: { bg: '#e6f4ea', text: '#137333', border: '#ceead6' },
          fail: { bg: '#fce8e6', text: '#c5221f', border: '#f5c6c4' },
          review: { bg: '#fef7e0', text: '#b06000', border: '#fde68a' },
        },
      },
      borderRadius: {
        pill: '100px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
        'nav': '0 2px 4px rgba(0,0,0,0.06)',
        'btn': '0 4px 12px rgba(26,115,232,0.30)',
      },
    },
  },
  plugins: [],
};
