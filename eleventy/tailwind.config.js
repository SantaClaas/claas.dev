import materialTailwind from "@claas.dev/material-tailwind";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./**/*.html", "./main.js", "./cv.njk", "!./_site/**/*"],

  theme: {
    extend: {},
  },
  plugins: [materialTailwind({ source: "#942DE3" })],
};
