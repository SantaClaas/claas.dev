---
title: Learning WebC
---

WebC is a templating language for building static websites with [Eleventy](https://www.11ty.dev/).
It brings "first-class components to Eleventy" and allows you to easily progressively enhance your blog like adding web
components to it.
These are reasons I wanted to try it as even the official site seems to be switching to it. But what pushed me over the
edge was using the official [Eleventy Image plugin](https://www.11ty.dev/docs/plugins/image/) which for me is an easier
solution to optimizing my images than the other ways to integrate the plugin.

# List of pitfalls I encountered

## Looping through posts

This is one of the most basic things a blog wants to do. And it is very simple with WebC, but it took
me longer to find out how to do than I'd want to admit.
The solution:

```html
<ol>
  <li webc:for="post of collections.post">
    <h2 @text="post.data.title"></h2>
  </li>
</ol>
```

Thanks to Raymond Camden who got me on the right path with [his blog post](https://www.raymondcamden.com/2023/04/04/webc-updates-in-eleventy-looping).
If you search on the web you are most likely to find a different solution:
Writing some JavaScript to create HTML markup string. Which would look something like this:

```html
<script webc:setup>
  function getHighlightedBlogPostContent(collection) {
    let posts = findBy(collection, "data.homePageHighlight", true);
    if (!posts.length) {
      return "";
    }
    posts.reverse();

    let content = [];
    let index = 0;
    for (let post of posts) {
      content.push(
        `<li><a href="${post.url}">${index === 0 ? `<strong>` : ""}${
          post.data.newstitle
        }${index === 0 ? `</strong>` : ""}</a> (<em>${newsDate(
          post.date
        )}</em>)</li>`
      );
      index++;
    }
    // 10 hardcoded posts on the blog
    content.push(
      `<li>…and <a href="/blog/">${
        collection.length + 10 - posts.length
      } more on the <strong>blog archives</strong></a>.</li>`
    );

    return `${content.join("")}`;
  }
  //...
</script>
```

This is from the [official eleventy website repository](https://github.com/11ty/11ty-website/blob/ab7c6c064e547b1436b64e87ad37648caeabe515/src/index.webc#L31C1-L49C2).
Though it is an unfair comparison as it does more than the first example. But it illustrates how most examples I could find
for looping through posts use custom markup generating JavaScrip. Which for my basic usecase felt icky.

### Loop Syntax Gotcha

The WebC Syntax aims to be like JavaScipt so you need to use `webc:for="item **of** items"` instead of `webc:for="item **in** items`.
But this is probably just a 11pm recovering from feeling sick skill issue. And if we want to blame someone we should blame JS.
(Why is it `in` for object properties in the first place?)
