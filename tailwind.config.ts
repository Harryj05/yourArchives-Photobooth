import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          red: '#8C1D24',
          burgundy: '#4A0F14',
          cream: '#F4F1EA',
          silver: '#C8C8C8',
          black: '#1C1C1C',
        },
        burgundy: {
          950: '#1A0208',
          900: '#2D0512',
          800: '#4A0A1F',
          700: '#6B1030',
          600: '#8B1A42',
          500: '#A82255',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['monospace'], // For that industrial/label feel
      },
      animation: {
        'shutter-flash': 'shutterFlash 0.3s ease-in-out forwards',
        'photo-strip-reveal': 'photoStripReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'photo-strip-drop': 'photoStripDrop 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'curtain-left-open': 'curtainLeftOpen 1.8s cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'curtain-right-open': 'curtainRightOpen 1.8s cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'subtle-glow': 'subtleGlow 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        shutterFlash: {
          '0%': { backgroundColor: 'white', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        photoStripReveal: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        photoStripDrop: {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        curtainLeftOpen: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        curtainRightOpen: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        subtleGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
