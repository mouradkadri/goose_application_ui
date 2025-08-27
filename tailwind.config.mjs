/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // --- ADD THESE NEW PROPERTIES FOR THE ANIMATION ---
      keyframes: {
         'pulse-border': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 10px hsl(var(--primary) / 0)',
          },
        },
      },
      animation: {
        'gradient-move': 'gradient-move 4s ease infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
      // --- END OF NEW PROPERTIES ---
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;