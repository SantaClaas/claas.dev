import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import tailwindConfig from "./tailwind.config.js";
import postcss from "postcss";
import Image from "@11ty/eleventy-img";
import webCPlugin from "@11ty/eleventy-plugin-webc";
import inclusiveLanguage from "@11ty/eleventy-plugin-inclusive-language";
import { createHighlighter } from "shiki";
/**
 * New TypeScript 5.5 JSDoc import syntax
 * @import { BundledLanguage, BundledTheme } from "shiki"
 * @import { UserConfig } from "@11ty/eleventy"
 * @typedef {{ theme: BundledTheme, languages: BundledLanguage[], themes: BundledTheme[] }} Options
 */
/**
 * @param {UserConfig} configuration
 * @param {Options} options
 */
async function shikiPlugin(configuration, options) {
  const highlighter = await createHighlighter(options);
  configuration.amendLibrary("md", (library) => {
    library.set({
      highlight: (code, language) => {
        // UDL is a a type of interface definition language for UniFFI to create bindings for Rust
        // And it seems to be too niche
        if (language === "udl") {
          language = "text";
        }

        return highlighter.codeToHtml(code, {
          lang: language,
          theme: options.theme,
        });
      },
    });
  });
}

// Can be async too
/** @param {UserConfig} configuration */
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

  // TODO checkout rehype for markdown processing as it works shiki
  configuration.addPlugin(
    shikiPlugin,
    /** @type {Options} */ ({
      theme: "dark-plus",
      themes: ["dark-plus"],
      // It is kind of a hassle to define each language beforehand but at least this doesn't silently break highlighting
      langs: [
        "bash",
        "html",
        "toml",
        "rust",
        "groovy",
        "kotlin",
        "ruby",
        "swift",
      ],
    })
  );
  configuration.addPlugin(inclusiveLanguage);

  //TODO integrate WCAG reporting https://github.com/hidde/eleventy-wcag-reporter and https://github.com/inclusive-design/idrc-wcag-reporter
  //TODO integrate W3C HTML validator https://www.npmjs.com/package/w3c-html-validator
  return {
    dir: {
      layouts: "layouts",
    },
  };
}
