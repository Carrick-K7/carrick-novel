/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        miku: {
          primary: '#39c5bb',
          'primary-dark': '#2da8a0',
        }
      },
      backgroundColor: {
        miku: {
          DEFAULT: 'var(--miku-bg)',
          secondary: 'var(--miku-bg-secondary)',
        }
      },
      textColor: {
        miku: {
          DEFAULT: 'var(--miku-text)',
          secondary: 'var(--miku-text-secondary)',
          muted: 'var(--miku-text-muted)',
        }
      },
      borderColor: {
        miku: 'var(--miku-border)',
      }
    },
  },
  plugins: [],
}
