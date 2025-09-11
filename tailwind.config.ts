import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Catholic-inspired color palette
        marian: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b2ff',
          300: '#4d93ff',
          400: '#1a74ff',
          500: '#003087', // Main Marian blue
          600: '#002a75',
          700: '#002463',
          800: '#001e51',
          900: '#00183f',
        },
        liturgical: {
          50: '#fffef5',
          100: '#fffce6',
          200: '#fff9cc',
          300: '#fff5b3',
          400: '#fff299',
          500: '#FFD700', // Liturgical gold
          600: '#e6c300',
          700: '#ccad00',
          800: '#b39800',
          900: '#998200',
        },
        vatican: {
          50: '#FAFAFA', // Vatican white
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Additional modern colors for the new design
        'marian-blue': '#003d82',
        'liturgical-gold': '#d4af37',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#171717',
            h1: {
              fontFamily: 'Playfair Display, serif',
              fontWeight: '700',
            },
            h2: {
              fontFamily: 'Playfair Display, serif',
              fontWeight: '600',
            },
            h3: {
              fontFamily: 'Playfair Display, serif',
              fontWeight: '600',
            },
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-holy': 'linear-gradient(180deg, #FAFAFA 0%, #e6f0ff 100%)',
        'gradient-hero': 'radial-gradient(ellipse at top, #f0f4f8 0%, white 50%)',
        'gradient-marian': 'linear-gradient(135deg, #003d82 0%, #d4af37 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #003d82 0%, #0052cc 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 48, 135, 0.1), 0 10px 20px -2px rgba(0, 48, 135, 0.04)',
        'glow': '0 0 20px rgba(255, 215, 0, 0.3)',
        'hover': '0 12px 24px -10px rgba(0, 61, 130, 0.15)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}

export default config