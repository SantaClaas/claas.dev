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
  // Can't use the image as a plugin because
  // Setting widths gives error that sizes is missing in the template (idk why)
  // Can't set picture styles as picture is block element and the styled image is not where it was in the template
  configuration.addPlugin(
    Image.eleventyImagePlugin,
    /** @type {import("@11ty/eleventy-img").PluginOptions} */ ({
      // widths: ["auto"],
      // widths: [300, 600, 900, 1200, 1500],
      svgShortCircuit: false,
    })
  );

  // configuration.addShortcode("image", async function (src, alt, sizes) {
  //   const metadata = await Image(src, {
  //     widths: [300, 600],
  //   });

  //   const imageAttributes = {
  //     alt,
  //     sizes,
  //     loading: "lazy",
  //     decoding: "async",
  //   };

  //   // You bet we throw an error on a missing alt (alt="" works okay)
  //   return Image.generateHTML(metadata, imageAttributes);
  // });
  configuration.addPassthroughCopy("images");
  return {
    dir: {
      layouts: "layouts",
    },
  };
}
