/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Core vibrant palette
        'neon': {
          pink: '#FF2D92',
          cyan: '#00F0FF',
          lime: '#B8FF00',
          orange: '#FF6B2C',
          violet: '#9B5DE5',
          yellow: '#FFE66D',
        },
        // Dark backgrounds with personality
        'deep': {
          black: '#0A0A0B',
          purple: '#1A0A2E',
          blue: '#0A1628',
          slate: '#121218',
        },
        // Accent grays with slight warmth
        'warm': {
          50: '#FAFAF9',
          100: '#F5F4F2',
          200: '#E8E6E3',
          300: '#D4D1CC',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      boxShadow: {
        // Colored brutal shadows
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
        'brutal-pink': '4px 4px 0px 0px #FF2D92',
        'brutal-cyan': '4px 4px 0px 0px #00F0FF',
        'brutal-lime': '4px 4px 0px 0px #B8FF00',
        'brutal-orange': '4px 4px 0px 0px #FF6B2C',
        'brutal-violet': '4px 4px 0px 0px #9B5DE5',
        'brutal-yellow': '4px 4px 0px 0px #FFE66D',
        // Glow effects
        'glow-pink': '0 0 20px rgba(255, 45, 146, 0.5)',
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'glow-lime': '0 0 20px rgba(184, 255, 0, 0.5)',
        'glow-violet': '0 0 20px rgba(155, 93, 229, 0.5)',
      },
      backgroundImage: {
        // Gradient meshes
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-vivid': 'linear-gradient(135deg, #FF2D92 0%, #9B5DE5 25%, #00F0FF 50%, #B8FF00 75%, #FF6B2C 100%)',
        'mesh-dark': 'linear-gradient(135deg, #1A0A2E 0%, #0A1628 50%, #0A0A0B 100%)',
        'mesh-sunset': 'linear-gradient(135deg, #FF2D92 0%, #FF6B2C 50%, #FFE66D 100%)',
        'mesh-ocean': 'linear-gradient(135deg, #9B5DE5 0%, #00F0FF 50%, #B8FF00 100%)',
        'mesh-electric': 'linear-gradient(135deg, #00F0FF 0%, #9B5DE5 50%, #FF2D92 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'text-shimmer': 'text-shimmer 2.5s ease-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'right center' },
        },
        'gradient-y': {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'center top' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'center center' },
        },
        'gradient-xy': {
          '0%, 100%': { backgroundSize: '400% 400%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '400% 400%', backgroundPosition: 'right center' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
