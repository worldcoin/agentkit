import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
			},
			colors: {
				primary: {
					DEFAULT: '#3B82F6',
					dark: '#2563EB',
					light: '#60A5FA',
					50: '#EFF6FF',
					100: '#DBEAFE',
				},
				surface: {
					DEFAULT: '#FFFFFF',
					raised: '#F9FAFB',
					overlay: '#F3F4F6',
				},
				border: {
					DEFAULT: '#E5E7EB',
					light: '#F3F4F6',
				},
				'text-primary': '#111827',
				'text-secondary': '#6B7280',
				'text-muted': '#9CA3AF',
				success: {
					DEFAULT: '#22C55E',
					bg: '#F0FDF4',
				},
				error: {
					DEFAULT: '#EF4444',
					bg: '#FEF2F2',
				},
				warning: {
					DEFAULT: '#F59E0B',
					bg: '#FFFBEB',
				},
			},
		},
	},
	plugins: [],
}

export default config
