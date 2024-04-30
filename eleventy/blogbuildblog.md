# Blog Build Blog

Like [Full Stack Digital](https://fullstackdigital.io/blog/eleventy-vite-tailwind-and-alpine-js-rapid-static-site-starter-framework/) points out, most templates or starter projects add too much stuff.
It took me a while to sort through them to find an example for a minimal Setup with [Eleventy](https://11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).
Ironically their setup isn't minimal enough for me either but it goes a long way into the right direction.
So now getting to my minimal setup and why I think the layers in this minimal stack are necessary.

- Eleventy
  - We want to make an Eleventy page so this is pretty obvious.
- Tailwind CC
  - Again, we want Tailwind CSS, obvious.
- Vite
  - This one might not be obvious. The automatic build provided by Vite for Tailwind CSS is the easiest Tailwind CSS setup IMO. Your alternative is running Tailwind CSS manually and in parallel yourself which I did for years and learned to dislike.
- Eleventy Vite Plugin
  - Makes it easy to integrate Vite in the Eleventy process
