/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#071426',
        'dark-navy': '#0B1930',
        'iris': '#6C63FF',
        'iris-bright': '#8B7CFF',
        'pink': '#FF4F9A',
        'pink-light': '#FF8FC7',
        'text-primary': '#F8FAFF',
        'text-muted': '#9BA8C7',
        'glass': 'rgba(11, 25, 48, 0.6)',
        'glass-border': 'rgba(108, 99, 255, 0.15)',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'critical': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(108,99,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(108,99,255,0.6), 0 0 40px rgba(255,79,154,0.2)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'iris-pink': 'linear-gradient(135deg, #6C63FF, #FF4F9A)',
        'dark-gradient': 'linear-gradient(135deg, #071426 0%, #0B1930 50%, #071426 100%)',
      },
    },
  },
  plugins: [],
};
