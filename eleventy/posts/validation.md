---
title: Thoughts on Forms
description: You might be surprised what the web can offer you for handling forms without having to reach for a framework
---

> This is only a draft and rough thoughts that I want to formulate better

Alternative titles:

- Simple Form Validation
- The free built-in form framework. 0kB JS in size!

- Just skip this and read [Validating forms using JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation#validating_forms_using_javascript) on MDN

## Forms

- Wrap your inputs in a form. I'd bet money on it that they are already wrapped in a useless `div` anyways.

  - Change your save button to be a button of `type="submit"`
  - You don't have to place the button inside the form if it doesn't make sense. Use the [form attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#form).
  - This gives you keyboard navigation for free and users can submit with their enter key. And keyboard navigation is usually associated with accessibility too!
  - If you need a reset button there is a [reset button](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type) but this might annoy users.

- Congratulations, you got HTML code that you can even use without JavaScript. This makes your code more portable should you decide to ever move to a different architecture or web framework. Even though I think portability is a weak argument. Comparable to ORMs advertising portability for their abstraction over SQL because you will definitively switch databases. But what this definitively gives you is [progressive enhancement](https://www.w3.org/wiki/Graceful_degradation_versus_progressive_enhancement) and it respects the [rule of least power](https://www.w3.org/2001/tag/doc/leastPower.html)
- Now you can add a submit event handler and add the preventDefault.

## Controlled vs uncontrolled inputs

- Use controlled when you need to live update something as the user types. Otherwise don't. It can heavily degrade your user experience and drive users mad when your input lags behind or a user enters something only for it to get deleted because your JS was busy and couldn't handle the user input.
- In most cases you don't
- The forgotten loop
  - The common belief seems to be that the user enters something and your app stores the value and update the screen with new data. It is the user entering something, the browser updating the screen, then updating your app and your app then updating the browser which tells the browser to update the screen again. (I haven't looked at browser source code to confirm this exact order of events) You don't have to do that. The browser is keeping the state of the users input long before we used JavaScript.
- Controlled inputs in vue can be spotted by looking for `v-model`. Being new to Vue I am wondering why is everyone using v-model in Vue? Is it just common practice that no one has ever asked why?
