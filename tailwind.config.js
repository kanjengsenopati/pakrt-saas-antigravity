/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                jakarta: ['Inter', 'sans-serif'],
                headline: ['Inter', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                label: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'card': '20px',
                'btn': '12px',
            },
            boxShadow: {
                'premium': '0 8px 30px rgb(0, 0, 0, 0.04)',
            },
            colors: {
                brand: {
                    50: 'rgb(var(--color-brand-50) / <alpha-value>)',
                    100: 'rgb(var(--color-brand-100) / <alpha-value>)',
                    200: 'rgb(var(--color-brand-200) / <alpha-value>)',
                    300: 'rgb(var(--color-brand-300) / <alpha-value>)',
                    400: 'rgb(var(--color-brand-400) / <alpha-value>)',
                    500: 'rgb(var(--color-brand-500) / <alpha-value>)',
                    600: 'rgb(var(--color-brand-600) / <alpha-value>)',
                    700: 'rgb(var(--color-brand-700) / <alpha-value>)',
                    800: 'rgb(var(--color-brand-800) / <alpha-value>)',
                    900: 'rgb(var(--color-brand-900) / <alpha-value>)',
                },
                coral: {
                    500: 'rgb(var(--color-coral-500) / <alpha-value>)',
                    600: 'rgb(var(--color-coral-600) / <alpha-value>)',
                },
                navy: {
                    900: 'rgb(var(--color-brand-900) / <alpha-value>)',
                },
                'primary': '#0050d4',
                'primary-dim': '#0046bb',
                'inverse-primary': '#618bff',
                'on-primary': '#f1f2ff',
                'primary-container': '#7b9cff',
                'on-primary-container': '#001e5a',
                'background': '#f5f7f9',
                'on-background': '#2c2f31',
                'surface': '#f5f7f9',
                'on-surface': '#2c2f31',
                'surface-variant': '#d9dde0',
                'on-surface-variant': '#595c5e',
                'surface-container-lowest': '#ffffff',
                'surface-container-low': '#eef1f3',
                'surface-container-high': '#dfe3e6',
                'surface-container-highest': '#d9dde0',
                'outline': '#747779',
                'outline-variant': '#abadaf',
                'secondary': '#4e5c71',
                'on-secondary': '#edf3ff',
                'secondary-container': '#d5e3fc',
                'on-secondary-container': '#455367',
                'tertiary': '#702ae1',
                'tertiary-container': '#c0a0ff',
                'error': '#b31b25'
            }
        },
    },
    plugins: [],
}
