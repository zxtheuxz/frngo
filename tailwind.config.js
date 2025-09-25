/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#8E2DE2',     // Roxo principal
          secondary: '#4A00E0',   // Roxo secundário
          dark: '#1A1A1A',       // Fundo escuro
          light: '#F8F9FA',      // Texto claro
          accent: '#9B51E0',     // Roxo accent para destaques
          purple: {
            light: '#A855F7',
            DEFAULT: '#8E2DE2',
            dark: '#4A00E0',
          },
          gray: {
            light: '#F8F9FA',
            DEFAULT: '#6B7280',
            dark: '#1A1A1A',
          }
        },
        backgroundImage: {
          'gradient-primary': 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
          'gradient-dark': 'linear-gradient(180deg, #1A1A1A 0%, #2D1A4A 100%)',
          'gradient-card': 'linear-gradient(135deg, rgba(142, 45, 226, 0.1) 0%, rgba(74, 0, 224, 0.1) 100%)',
        },
        boxShadow: {
          'glow-purple': '0 0 20px rgba(142, 45, 226, 0.3)',
          'glow-dark': '0 4px 12px rgba(0, 0, 0, 0.25)',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
    },
  },
  plugins: [],
}
