# ES6 Generators: How do They Work?

*Перевод статьи Josh Johnston: [ES6 Generators: How do They Work?](https://x-team.com/blog/generators-work/)*

*Дата публикации: 28.04.2015*

It can be tricky to write software that produces the correct result. But we all know that this only marks the line where the real challenge begins. Finding a good way to model the solution can make the difference between something that “makes sense” and is a joy to work with, versus something that ends up wrapped in comments like this:

```js
//
// Dear maintainer:
//
// Once you are done trying to 'optimize' this routine,
// and have realized what a terrible mistake that was,
// please increment the following counter as a warning
// to the next guy:
//
// total_hours_wasted_here = 42
//
```

(source: [http://stackoverflow.com/questions/184618/what-is-the-best-comment-in-source-code-you-have-ever-encountered/482129#482129](http://stackoverflow.com/questions/184618/what-is-the-best-comment-in-source-code-you-have-ever-encountered/482129#482129))

Today we’ll be looking at how [ES6 Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) work under the hood, in order to understand better how we can use them to solve old problems in new ways.

## Do not block

You might have heard of the importance of writing “non-blocking” javascript. When we do an I/O operation, like make an HTTP request or write to a database, we generally want to use something like callbacks or promises. Performing a “blocking” operation would cause the entire program to freeze, which in most cases is not a viable option. Imagine if all of your users had to sit and wait any time someone else wanted to interact with the system.

Another consequence of this is that if a javascript program ever enters an infinite loop you’re pretty much cooked. Running `node -e 'while(true) {}' will possibly freeze your computer and require a system reboot. Maybe don’t try that one at home ( ⚆ _ ⚆ )

With all of this in mind, it’s curious to hear that ES6 Generators allow us to effectively “pause” execution in the middle of a function and resume it at some time in the future. There are also many examples of generators flaunting their infinite loops in a casual“*just looping infinitely, NBD*” kind of manner. At first glance you might think that a significant overhaul of the platform would be required in order to allow these previously deal-breaking behaviours. Yet with tools like [Regenerator](https://facebook.github.io/regenerator/) and [Babel](https://babeljs.io/) this functionality is readily available for us in plain old ES5. Did you ever wonder what kind of arcane rituals are enacted to make this possible? Today we will find out. Hopefully we’ll also come away with a deeper understanding of how generators work and how to make the most of them.

Before we begin: if you’re new to generators I recommend the [nodeschool workshop](http://nodeschool.io/#workshoppers) for an awesome hands-on tutorial that will guide you through the basics. Just `npm install -g learn-generators` and then run the `learn-generators` command. You can also [grab it from github](https://github.com/isRuslan/learn-generators):

![Learn Generators](images/generators_work.webp "Learn Generators")

## A Lazy Sequence

Let’s start with a simple example. Imagine you need to do something with a sequence of values. You might model it as an array and operate on the values that way. But what if the sequence is of infinite length? Arrays won’t do here. We could instead model it as a generator function:

```js
function* generateRandoms (max) {
  max = max || 1;

  while (true) {
    let newMax = yield Math.random() * max;
    if (newMax !== undefined) {
      max = newMax;
    }
  }
}
```

Note the `function*` part, which indicates this is a special “generator function” and will behave differently to an ordinary `function`. Another important part is the `yield` keyword on line 5. Ordinary functions can only send back results when they end with a `return`. Generator functions send back results whenever they `yield`.

We can read the intent of this function as "*Every time you are asked for the next value, give a random number between 0 and max. Keep doing this until the program is exited or until all human technology is destroyed in the great solar flare of 2065. Whichever comes first*".

As the summary suggests, we only get values from a generator when we ask for them. This is important because otherwise an infinite sequence like this could quickly flood all available memory. We ask for values using an iterator, which is what we get when we call the generator function:

```js
var iterator = generateRandoms();

console.log(iterator.next());     // { value: 0.4900301224552095, done: false }
console.log(iterator.next());     // { value: 0.8244022422935814, done: false }
```

Generators also allow two-way communication, like in line 5: `let newMax = yield Math.random() * max`. As we’ll see later, generators go into a “suspended” state whenever they’re not being used, and wake up when an iterator asks for the next value. So when we call `iterator.next` and pass in a value as an argument, that value effectively replaces the `yield Math.random() * max` part, and sets the value of `newMax`. You can see it in action here:

```js
console.log(iterator.next());     // { value: 0.4900301224552095, done: false }

// send a value to set `newMax`, which will persist for future calls to `.next()`:
console.log(iterator.next(1000)); // { value: 963.7744706124067, done: false }
console.log(iterator.next());     // { value: 714.516609441489, done: false }
```

## Generators in ES5

To understand more about how generators work it’s helpful to see how they translate into ES5. You can try this for yourself by installing babel and then viewing the source it produces.

```bash
npm install -g babel

babel generate-randoms.js
```

Here’s what we get when we run that transformation:

```js
var generateRandoms = regeneratorRuntime.mark(function generateRandoms(max) {
  var newMax;
  return regeneratorRuntime.wrap(function generateRandoms$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        max = max || 1;

      case 1:
        if (!true) {
          context$1$0.next = 8;
          break;
        }
        context$1$0.next = 4;
        return Math.random() * max;
      case 4:
        newMax = context$1$0.sent;
        if (newMax !== undefined) {
          max = newMax;
        }
        context$1$0.next = 1;
        break;
      case 8:
      case "end":
        return context$1$0.stop();
    }
  }, generateRandoms, this);
});
```

As you can see, the guts of the generator function has been rewritten as a `switch` block (beginning on line 4). This gives a valuable clue about the inner workings. We can think of a generator like a state-machine in a loop, behaving differently based on how we interact with it. The `context$1$0` variable holds the current state, including which `case` block to execute next.

An easy way to understand this code is to pretend that the `case` statements are line numbers, and setting the value of `context$1$0.next` is a `GOTO`. If, like me, you started out years ago writing BASIC, I’ll give you a moment to wipe away the tears of blissful nostalgia before we move on.

Take a look at that switch block again in those terms:

- `case 0`: initialize the value of `max` and proceed to `case 1`. (line 6)
- `case 1`: send back (or “yield”) a random value and `GOTO 4` the next time we resume. (lines 13-14)
- `case 4`: check whether the iterator sent a value (`context$1$0.sent`) and update the value of `max`. And then `GOTO 1`, to send back the next random number.

This gives us some insight into how a generator can loop infinitely, pausing until each new value is asked for, while still respecting the “do-not-block” rule.

## When is true not true?

Readers who were paying attention will have spotted that I skipped over lines 9-12:

```js
if (!true) {
    context$1$0.next = 8;
    break;
}
```

What’s going on here? It turns out this is how our original `while (true)` was rewritten. Every time the state-machine loops it checks whether we’ve reached the end. In our example this can never be, but there are plenty of times where you would want an exit clause in your generator. When that happens we have a `GOTO 8` which is where the generator shuts down.

## Local state for iterators

Another interesting thing we see here is how the generator keeps a local state for every individual iterator. Because the `max` variable is scoped outside of the `regeneratorRuntime.wrap` closure its value will persist for subsequent calls to `iterator.next()`, as demonstrated earlier. And if we make a new iterator by calling `randomNumbers()` again a new closure will be created. This shows us how each iterator can have its own state without affecting others using the same generator.

## Inside the machine

What we’ve been looking at so far in the `switch` is actually just the “front” of the state-machine. You’ve probably noticed that the function is wrapped twice, with `regeneratorRuntime.mark` and `regeneratorRuntime.wrap`. These are from the [https://github.com/facebook/regenerator](https://github.com/facebook/regenerator) module and they define a generic state-machine in ES5 that behaves just like a generator-function does in ES6.

There’s a lot going on in the regnerator runtime but we’ll cover some of the interesting parts. First of all, we can see that the generator starts its life in the “Suspended Start” state (use the “source” link below to see this code snippet in context):

```js
 function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
```

source: [runtime.js:130,133](https://github.com/facebook/regenerator/blob/v0.8.22/runtime.js#L130-L133)

At this point nothing much has happened – it has just created a function and returned it. This means even when we call `var iterator = generateRandoms()`, nothing inside `generateRandoms` actually gets executed until the first time we ask it for a value.

When we call `iterator.next()` the generator function (with the `switch` block that we looked at earlier) is called inside `tryCatch`:

```js
var record = tryCatch(innerFn, self, context);
```

source: [runtime.js:234](https://github.com/facebook/regenerator/blob/v0.8.22/runtime.js#L234)

and if the result was a normal `return` (rather than a `throw`) we package up the result in the [format expected of an iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_.22iterable.22_protocol): `{ value, done }`. We also set the new state which will be either `GenStateCompleted` or `GenStateSuspendedYield`. In our case since it’s an infinite loop it will always go to “suspended yield”.

```js
var record = tryCatch(innerFn, self, context);
if (record.type === "normal") {
    // If an exception is thrown from innerFn, we leave state ===
    // GenStateExecuting and loop back for another invocation.
    state = context.done
        ? GenStateCompleted
        : GenStateSuspendedYield;

    var info = {
        value: record.arg,
        done: context.done
    };
```

source: [runtime.js:234,245](https://github.com/facebook/regenerator/blob/v0.8.22/runtime.js#L234-L245)

## What can you do with it?

Today we’ve used a simple generator function to model a state-machine that produces a potentially infinite sequence of values, that can be lazily consumed. This is behaviour we can start using right now: it is already natively supported in modern javascript platforms, and is easily transpiled for the rest.

As always, there are many ways you might reach the same goal. In that sense we don’t *need* generators, but if they allow us the expressiveness to achieve our intent in a way that “makes sense”, it’s all worthwhile. Have you found other ways to model solutions for common problems using generators?