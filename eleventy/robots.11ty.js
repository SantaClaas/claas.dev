// <template webc:nokeep @text="">Sitemap: https://claa/sitemap.xml

// User-agent: *
// Disallow:
// Raw js template file to generate robots.txt
export function data() {
  return {
    permalink: "/robots.txt",
    eleventyExcludeFromCollections: true,
  };
}

/**
 *
 * @param {{ withBase: (url: string) => string }} data
 * @returns
 */
export default function render(data) {
  return `Sitemap: ${data.withBase("/sitemap.xml")}

User-agent: *
Disallow:`;
}
