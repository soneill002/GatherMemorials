/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind where to look for classes to include in the final CSS
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors for Catholic aesthetic
      colors: {
        'marian-blue': {
          DEFAULT: '#1A3C8C',
          50: '#E8EFFA',
          100: '#D1DEF4',
          200: '#A3BDE9',
          300: '#759CDE',
          400: '#477BD3',
          500: '#1A3C8C',  // Primary
          600: '#163470',
          700: '#122C54',
          800: '#0E2338',
          900: '#0A1B1C',
        },
        'liturgical-gold': {
          DEFAULT: '#D4AF37',
          50: '#FBF7EA',
          100: '#F7EFD5',
          200: '#EFDFAB',
          300: '#E7CF81',
          400: '#DFBF57',
          500: '#D4AF37',  // Primary
          600: '#B8952C',
          700: '#9C7B21',
          800: '#806116',
          900: '#64470B',
        },
      },
      // Typography that respects the sacred nature of memorials
      fontFamily: {
        // Serif for headings - traditional, dignified
        serif: ['Crimson Text', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Sans-serif for body - clean, readable
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Mobile-first spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      // Mobile-first font sizes using clamp for fluid typography
      fontSize: {
        // Fluid typography that scales smoothly from mobile to desktop
        'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 7vw, 3rem)',
      },
      // Animation for respectful, subtle interactions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}