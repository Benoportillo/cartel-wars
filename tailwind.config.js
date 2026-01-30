/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./views/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                marker: ['Permanent Marker', 'cursive'],
            },
            colors: {
                cartel: {
                    red: '#dc2626',
                    dark: '#0a0a0a',
                    zinc: '#18181b',
                }
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
};
