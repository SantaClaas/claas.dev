// Apparently this is included in eleventy but I just can't get it to work
import slugify from "slugify";

export default {
  layout: "post.webc",
  tags: ["post"],
  date: "git Last Modified",
  permalink: (/** @type {{title: string}} */ { title }) =>
    `/posts/${slugify(title, { lower: true })}/`,
  eleventyComputed: {
    hierarchy: (/** @type {{title: string}} */ data) => {
      return {
        key: data.title,
        parent: "index",
      };
    },
  },
};
