---
title: Scroll state container queries in Tailwind CSS
description: How to use the new scroll-state() container query in Tailwind CSS v4
---

Scroll state container queries are fresh out of the oven and can only be used in chromium browser right now.
But if you like to play with cutting edge CSS and also want to use Tailwind CSS, this is for you.
I recommend reading the [article on Scroll state container](https://developer.chrome.com/blog/css-scroll-state-queries) queries first.
The cool thing about this CSS feature is that it can be easily used as progressive enhancement not breaking styles for users on browser without this feature.
This is what I came up with trying to follow the prior art by Tailwind CSS with container queries.

```css
/* Following the existing container query classes or you can use @container-[scroll-state] */
.\@container-scroll {
  container-type: scroll-state;
}

@custom-variant @stuck-top {
  @supports (container-type: scroll-state) {
    @container scroll-state(stuck: top) {
      @slot;
    }
  }
}
```

There are other scroll container queries but I think you get how it works and can fill in the blanks.

# Reference:

- [Tailwind CSS custom variants](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-variants)
- [CSS scroll-state()](https://developer.chrome.com/blog/css-scroll-state-queries)
