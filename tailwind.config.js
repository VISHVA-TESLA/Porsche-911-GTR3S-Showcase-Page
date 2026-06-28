/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          400: "#e8a663", // rim/taillight accent — desaturated copper, not stock amber
        },
      },
      fontFamily: {
        wide: ['"Syncopate"', "sans-serif"],
        sans: ['"Montserrat"', "ui-sans-serif", "system-ui"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
