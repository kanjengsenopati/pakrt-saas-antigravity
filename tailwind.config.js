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
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
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
                }
            }
        },
    },
    plugins: [],
}
