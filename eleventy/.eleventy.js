import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import tailwindConfig from "./tailwind.config.js";
import postcss from "postcss";

// Can be async too
/** @param {import("@11ty/eleventy/src/UserConfig").default} configuration */
export default function (configuration) {
  // configuration.addWatchTarget("./index.css");
  // configuration.addAsyncFilter("postcss", postcssFilter);

  configuration.addTemplateFormats("css");
  configuration.addExtension("css", {
    outputFileExtension: "css",
    async compile(content, path) {
      // Processing
      // Only use central CSS file in which everything is imported
      if (path !== "./index.css") return;

      return async () => {
        const output = await postcss([
          tailwindcss(tailwindConfig),
          autoprefixer(),
          cssnano({
            presets: "default",
          }),
        ]).process(content, { from: path });

        return output.css;
      };
    },
  });
}
