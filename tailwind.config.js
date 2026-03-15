/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        shell: '#f7f1de',
        ink: '#1b2b26',
        primary: '#2eb489',
        primaryDark: '#20906c',
        accent: '#ffd166',
        danger: '#ef476f',
        success: '#06d6a0',
      },
      boxShadow: {
        chunky: '0 6px 0 rgba(27,43,38,0.28)',
      },
      borderRadius: {
        chunky: '1.2rem',
      },
    },
  },
  plugins: [],
}
