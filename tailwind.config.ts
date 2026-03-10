import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#4ADE80',
          50: '#F0FDF4',
          100: '#DCFCE7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#FFFFFF',
          overlay: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E4E4E7',
          light: '#F4F4F5',
        },
        'text-primary': '#09090B',
        'text-secondary': '#52525B',
        'text-muted': '#71717A',
        success: {
          DEFAULT: '#22C55E',
          bg: '#F0FDF4',
        },
        error: {
          DEFAULT: '#09090B',
          bg: '#FAFAFA',
        },
        warning: {
          DEFAULT: '#09090B',
          bg: '#FAFAFA',
        },
      },
    },
  },
  plugins: [],
}

export default config
