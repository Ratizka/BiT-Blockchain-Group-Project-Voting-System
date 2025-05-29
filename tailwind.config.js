const colors = require('tailwindcss/colors');

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"], // Changed from purge
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          DEFAULT: '#1E40AF', // Darker blue for better visibility
          500: '#1E40AF',
          600: '#1E3A8A',
          700: '#1E3A78',
          800: '#172554',
          900: '#0F172A',
          dark: '#1E3A8A', // Even darker for hover states
        },
        secondary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          DEFAULT: '#C2410C', // Deeper orange for better contrast
          500: '#C2410C',
          600: '#9A3412',
          700: '#7C2D12',
          800: '#7C2A0E',
          900: '#431407',
          dark: '#9A3412',
        },
        success: {
          50: '#F0FFF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#68D391',
          DEFAULT: '#48BB78',
          500: '#48BB78',
          600: '#3F9D61',
          700: '#2F855A',
          800: '#276749',
          900: '#22543D',
          dark: '#2F855A',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          DEFAULT: '#ECC94B',
          500: '#ECC94B',
          600: '#D97706',
          700: '#B7791F',
          800: '#92400E',
          900: '#78350F',
          dark: '#B7791F',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          DEFAULT: '#F56565',
          500: '#F56565',
          600: '#DC2626',
          700: '#C53030',
          800: '#991B1B',
          900: '#7F1D1D',
          dark: '#C53030',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          DEFAULT: '#4299E1',
          500: '#4299E1',
          600: '#2563EB',
          700: '#2B6CB0',
          800: '#1E40AF',
          900: '#1E3A8A',
          dark: '#2B6CB0',
        },
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          DEFAULT: '#6C757D',
          500: '#6C757D',
          600: '#495057',
          700: '#3D444B', // Added missing 700 shade
          800: '#343A40',
          900: '#212529',
          dark: '#343A40',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      boxShadow: {
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-active': '0 5px 10px -3px rgba(0, 0, 0, 0.1), 0 2px 3px -2px rgba(0, 0, 0, 0.05)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'emboss': '0 1px 2px rgba(0, 0, 0, 0.1), 0 -1px 2px rgba(255, 255, 255, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      // Add utility classes
      const newUtilities = {
        '.realtime-update': {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.dashboard-card': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.dashboard-card:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme('boxShadow.card-hover'),
        },
        '.line-clamp-1': {
          display: '-webkit-box',
          '-webkit-line-clamp': '1',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.clickable': {
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
        '.clickable:active': {
          transform: 'scale(0.97)',
        },
        '.shimmer': {
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        },
        '.animate-on-scroll': {
          opacity: '0',
          transform: 'translateY(20px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        },
        '.animate-on-scroll.visible': {
          opacity: '1',
          transform: 'translateY(0)',
        },
        // Custom animations
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      };
      
      addUtilities(newUtilities);      
      // Add text gradient utilities manually
      addUtilities({
        '.text-gradient-primary': {
          backgroundImage: 'linear-gradient(to right, var(--tw-gradient-stops))',
          '--tw-gradient-from': theme('colors.primary.400'),
          '--tw-gradient-to': theme('colors.primary.600'),
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        },
        '.text-gradient-secondary': {
          backgroundImage: 'linear-gradient(to right, var(--tw-gradient-stops))',
          '--tw-gradient-from': theme('colors.secondary.400'),
          '--tw-gradient-to': theme('colors.secondary.600'),
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }
      });    },
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'), // Add typography plugin
    require('@tailwindcss/aspect-ratio'),
  ],
}
