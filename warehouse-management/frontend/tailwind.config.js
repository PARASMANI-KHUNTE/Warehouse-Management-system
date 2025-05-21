/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d8eaff',
          200: '#b8d9ff',
          300: '#8ac1ff',
          400: '#559eff',
          500: '#2979ff',
          600: '#1366f1',
          700: '#0d4fd6',
          800: '#1042ab',
          900: '#123b85',
          950: '#0f2657',
        },
        secondary: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#c0a9ff',
          400: '#a379ff',
          500: '#8a4bff',
          600: '#7c2cf9',
          700: '#6b21dd',
          800: '#591db2',
          900: '#491c91',
          950: '#2e0f65',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'nav': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      gridTemplateColumns: {
        'dashboard': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  safelist: [
    // Status colors
    'bg-green-100', 'text-green-800',
    'bg-blue-100', 'text-blue-800',
    'bg-yellow-100', 'text-yellow-800',
    'bg-orange-100', 'text-orange-800',
    'bg-red-100', 'text-red-800',
    'bg-purple-100', 'text-purple-800',
    'bg-gray-100', 'text-gray-800',
    // Border colors
    'border-primary-500', 'border-primary-600',
    'border-success-500', 'border-success-600',
    'border-warning-500', 'border-warning-600',
    'border-danger-500', 'border-danger-600',
    // Background colors
    'bg-primary-50', 'bg-primary-100', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700',
    'bg-success-50', 'bg-success-100', 'bg-success-500', 'bg-success-600',
    'bg-warning-50', 'bg-warning-100', 'bg-warning-500', 'bg-warning-600',
    'bg-danger-50', 'bg-danger-100', 'bg-danger-500', 'bg-danger-600',
    // Text colors
    'text-primary-500', 'text-primary-600', 'text-primary-700',
    'text-success-500', 'text-success-600', 'text-success-700',
    'text-warning-500', 'text-warning-600', 'text-warning-700',
    'text-danger-500', 'text-danger-600', 'text-danger-700',
    // Button variants
    'btn', 'btn-primary', 'btn-secondary',
    // Form elements
    'input', 'card'
  ]
}
