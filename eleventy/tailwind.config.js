import materialTailwind from "@claas.dev/material-tailwind";
import typography from "@tailwindcss/typography";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./**/*.{html,webc,njk}", "./main.js", "!./_site/**/*"],

  theme: {
    extend: {},
  },
  plugins: [materialTailwind({ source: "#942DE3" }), typography],
};
