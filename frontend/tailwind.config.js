/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#172033',
          950: '#0b0f1a',
        },
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};
