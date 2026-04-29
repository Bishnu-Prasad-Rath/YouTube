/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neoWhite: "#FFFFFF",
        neoBlack: "#000000",
        neoYellow: "#FFD100",
        neoGreen: "#ADFF00",
        neoBlue: "#00E1FF"
      },
      boxShadow: {
        neo: "8px 8px 0px 0px rgba(0,0,0,1)",
      },
      borderWidth: {
        4: "4px",
      },
      borderColor: {
        neo: "#000000",
      },
      fontFamily: {
        sans: ["Lexend", "sans-serif"],
      }
    },
  },
  plugins: [],
}
