import materialTailwind from "@claas.dev/material-tailwind";
import typography from "@tailwindcss/typography";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: [
    "./**/*.{html,webc,njk}",
    "./main.js",
    "!./_site/**/*",
    "./design.md",
  ],

  theme: {
    extend: {},
  },
  plugins: [materialTailwind({ source: "#942DE3" }), typography],
};
