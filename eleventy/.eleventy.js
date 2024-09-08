import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import tailwindConfig from "./tailwind.config.js";
import postcss from "postcss";
import Image from "@11ty/eleventy-img";
import webCPlugin from "@11ty/eleventy-plugin-webc";
// Can be async too
/** @param {import("@11ty/eleventy/src/UserConfig").default} configuration */
export default function (configuration) {
  configuration.addTemplateFormats("css");
  configuration.addExtension("css", {
    outputFileExtension: "css",

    /**
     * @param {string} content
     * @param {string} path
     * @returns {Promise<string>}
     */
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

  configuration.addPlugin(webCPlugin, {
    components: [
      "./_includes/components/**/*.webc",
      // Add image as a global WebC component
      "npm:@11ty/eleventy-img/*.webc",
    ],
  });

  configuration.addPlugin(
    Image.eleventyImagePlugin,
    /** @type {import("@11ty/eleventy-img").PluginOptions} */ ({
      // widths: ["auto"],
      // widths: [300, 600, 900, 1200, 1500],
      // The urlPath should be ./img/ by default but it dumps them into the root directory for some reason maybe a bug
      // This is to adjust the HTML url paths as we are fine with them being in the root when deployed
      urlPath: "/",
      // Default output directory
      // outputDir: "./img/",
      svgShortCircuit: false,
    })
  );

  return {
    dir: {
      layouts: "layouts",
    },
  };
}
