// Apparently this is included in eleventy but I just can't get it to work
import slugify from "slugify";
let counter = 0;

export default {
  layout: "post.webc",
  tags: ["post"],
  date: "git Last Modified",
  permalink: ({ title }) => `/posts/${slugify(title, { lower: true })}/`,
  eleventyComputed: {
    // As simple unique id to use for view transitions. It is ok that this might leak count
    uniqueId: (_data) => counter++,
  },
};
