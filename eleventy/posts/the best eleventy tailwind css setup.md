---
title: The easiest Eleventy + Tailwind CSS setup
tags: post
---

# The easiest Eleventy + Tailwind CSS setup

1. Initialize Tailwind CSS by following their documentation
2. Follow [Vadim Makeev's article](https://pepelsbey.dev/articles/eleventy-css-js/) to set up PostCSS in Eleventy
3. Use Tailwind CSS as plugin in the PostCSS setup instead

For reference, check out [the commit where I implemented it](https://github.com/SantaClaas/claas.dev/tree/8e561f72e3166914f80a110000adec50dee6d78d) and possibly the future commits.

## Downsides

There is no hot reload or at least I haven't figured out a good hot reload experience for smoother development process.

## Looking forward to Lightning CSS

At the point of writing Tailwind CSS 4 is already in the works and they [seem to switch to Lightning CSS](https://tailwindcss.com/blog/tailwindcss-v4-alpha#unified-toolchain).
Vadim Makeev's page mentioned above seems to use it too by looking at [their Eleventy Setup on GitHub](https://github.com/pepelsbey/pepelsbey.dev/blob/6f90fe6ca1f68de28dc810239729cbc6a3662b67/eleventy.config.js#L7). So in the future it might be reasonable to use Tailwind CSS in Eleventy with [Lightning CSS](https://lightningcss.dev/).
