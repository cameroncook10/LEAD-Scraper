export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Modern professional palette inspired by 21st.dev
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // Primary brand color - Modern teal/cyan
        cyan: {
          50: '#ecf8ff',
          100: '#cff0fe',
          200: '#a5e8fc',
          300: '#67ddfb',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#082f49'
        },
        // Secondary brand color - Modern indigo
        indigo: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        },
        // Accent colors
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
          950: '#052e16'
        },
        amber: {
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
          950: '#451a03'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Menlo',
          '"Courier New"',
          'monospace'
        ]
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px'
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px'
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none'
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-in',
        slideUp: 'slideUp 300ms ease-out',
        slideDown: 'slideDown 300ms ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        // Glass effect for modern cards
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.7)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)'
        },
        // Smooth gradient text
        '.gradient-text': {
          'background': 'linear-gradient(135deg, var(--tw-gradient-stops))',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        // Button base styles
        '.btn': {
          '@apply': 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
        },
        '.btn-primary': {
          '@apply': 'btn bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500'
        },
        '.btn-secondary': {
          '@apply': 'btn bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500'
        },
        '.btn-ghost': {
          '@apply': 'btn text-slate-600 hover:bg-slate-100 focus:ring-slate-500'
        },
        '.btn-sm': {
          '@apply': 'px-3 py-1.5 text-sm'
        },
        '.btn-md': {
          '@apply': 'px-4 py-2 text-base'
        },
        '.btn-lg': {
          '@apply': 'px-6 py-3 text-lg'
        },
        // Input styles
        '.input': {
          '@apply': 'w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-10 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed'
        },
        // Card styles
        '.card': {
          '@apply': 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow'
        },
        '.card-hover': {
          '@apply': 'card hover:border-slate-300 cursor-pointer'
        },
        // Badge styles
        '.badge': {
          '@apply': 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium'
        },
        '.badge-success': {
          '@apply': 'badge bg-emerald-100 text-emerald-800'
        },
        '.badge-warning': {
          '@apply': 'badge bg-amber-100 text-amber-800'
        },
        '.badge-danger': {
          '@apply': 'badge bg-red-100 text-red-800'
        },
        '.badge-info': {
          '@apply': 'badge bg-cyan-100 text-cyan-800'
        }
      });
    }
  ]
};
