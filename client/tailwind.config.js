/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F8FAFC',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          primary: '#4F46E5',
          'primary-hover': '#4338CA',
          secondary: '#0284C7',
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626'
        }
      },
      borderRadius: {
        'card': '12px'
      }
    },
  },
  plugins: [],
}
