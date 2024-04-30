import materialTailwind from "@claas.dev/material-tailwind";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./main.js"],
  theme: {
    extend: {},
  },
  plugins: [materialTailwind({ source: "#942DE3" })],
};
