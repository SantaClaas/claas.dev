---
title: Shiki with eleventy
description: How syntax highlighting for code is implemented on this site
---

Integrating [Shiki](https://shiki.matsu.io/) for syntax highlighting in a couple of lines with Eleventy 3.0 (alpha 19 at the time of writing).

This builds up on [How I use Shiki in Eleventy by Stefan Zweifel](https://stefanzweifel.dev/posts/2024/06/03/how-i-use-shiki-in-eleventy/) who also built his solution upon [Using shiki with 11ty by Raphael Höser](https://www.hoeser.dev/blog/2023-02-07-eleventy-shiki-simple/).

This solution uses some hot out of the oven features like the new [TypesScript JSDoc `@import` Tag](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#the-jsdoc-import-tag) and the Eleventy 3.0 alpha which now allows async plugin functions and therefore no longer the workaround to get Shiki working.

Create a function that will act as a plugin and add it as a plugin in your eleventy configuration.

```js
import { createHighlighter } from "shiki";
/**
 * New TypeScript 5.5 JSDoc import syntax
 * @import { BundledLanguage, BundledTheme } from "shiki"
 * @import { UserConfig } from "@11ty/eleventy"
 * @typedef {% raw %}{{ theme: BundledTheme, languages: BundledLanguage[], themes: BundledTheme[] }}{% endraw %} Options
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
        return highlighter.codeToHtml(code, {
          lang: language,
          theme: options.theme,
        });
      },
    });
  });
}

/** The eleventy configuration function
 * @param {UserConfig} configuration
 */
export default function (configuration) {
  configuration.addPlugin(
    shikiPlugin,
    /** @type {Options} */ ({
      // Choose your theme
      theme: "dark-plus",
      // Define themes to be loaded
      themes: ["dark-plus"],
      // Choose your highlighted languages
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
}
```

If you don't want to load languages manually, you can import `bundledLanguages` or `bundledThemes` from shiki `Object.keys` it to get all the values but this is [not recommended by shiki](https://shiki.matsu.io/guide/install#highlighter-usage).
