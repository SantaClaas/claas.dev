let counter = 0;
const data = {
  layout: "post.webc",
  tags: ["post"],
  date: "git Created",
  eleventyComputed: {
    // As simple unique id to use for view transitions. It is ok that this might leak count
    uniqueId: (_data) => counter++,
  },
};
// if (process.env.NODE_ENV === "production") data.date = "git Last Modified";
export default data;
