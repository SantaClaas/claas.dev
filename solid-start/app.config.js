// import { defineConfig } from "@solidjs/start/config";
// import mdx from "@mdx-js/rollup";

// export default defineConfig({
//   // Configuration for GitHub Pages
//   // based on: https://dev.to/lexlohr/deploy-a-solid-start-app-on-github-pages-2l2l
//   // ssr: true,
//   // server: {
//   //   baseURL: process.env.BASE_PATH,
//   //   preset: "static",
//   // },
//   vite: {
//     plugins: [
//       {
//         enforce: "pre",
//         ...mdx({
//           jsxImportSource: "solid-js",
//           providerImportSource: "solid-mdx",
//         }),
//       },
//     ],
//   },
// });
import { defineConfig } from "@solidjs/start/config";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;
export default defineConfig({
  extensions: ["mdx", "md"],
  vite: {
    plugins: [
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
      }),
    ],
  },
});
