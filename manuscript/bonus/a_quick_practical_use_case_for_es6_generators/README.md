# A Quick, Practical Use Case for ES6 Generators

## Building an Infinitely Repeating Array

*Перевод статьи Yash Agrawal: [A Quick, Practical Use Case for ES6 Generators](https://itnext.io/a-quick-practical-use-case-for-es6-generators-building-an-infinitely-repeating-array-49d74f555666)*

*Дата публикации: 06.06.2018*

## Preface

You’ve probably heard of ES6 generators, perhaps you’ve even learned the syntax, and you may be wondering what they’re actually useful for in real life.

### Definition (from MDN)

> Generators are functions which can be exited and later re-entered. Their context (variable bindings) will be saved across re-entrances. — [MDN] (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)

You may be thinking, “*Okay, but why would I want to do that?*” As it turns out, there are a whole range of use cases ranging from simple to complex, many of which involve Promises to make asynchronous requests (async/await is built on top of generators). My goal is to give you the first baby step into understanding how they work with a simple, real-life example so that you begin noticing when a generator is the most suitable solution to problems in your own code. Here we go.

## Use Case

I’m building an app in which my users can calculate a 3-week workout cycle, with a setting to work out between 3 and 7 days per week during the cycle. Each individual workout is based on one of the following 4 lifts: *squat*, *bench press*, *deadlift*, and *overhead press*, and each successive workout must be based on the next lift in that order:

- Squat
- Bench
- Deadlift
- Overhead press
- Squat
- Bench
- Deadlift
- Overhead press
- …

You can probably see where this is going.

I need my code to say, “*Give me the lift for the next workout, then the next, then the next, etc. When the end of the list of lifts is reached, start over from the beginning and keep repeating forever, until I’ve generated all the workouts for the 3-week cycle.*” Here’s a simplified version of how I initially implemented it, without generators:

```js
const lifts = ['squat', 'bench', 'deadlift', 'press'];
const numWeeks = 3;
const daysPerWeek = 6;

const totalNumSessions = numWeeks * daysPerWeek;

let currentLiftIndex = 0;

// This creates an empty array of totalNumSessions length
// for me to map over
const cycle = [...Array(totalNumSessions)].map(() => ({
    lift: lifts[currentLiftIndex++ % lifts.length]
}));
```

Not *too* bad, but it could be more declarative. Wouldn’t it be nice if we didn’t have to keep track of that `currentLiftIndex` directly in our workout generation code? It decreases the readability of the code and feels like it belongs in its own function. Here’s the code using a generator function, I’ll explain it below.

```js
function* repeatedArray(arr) {
  let index = 0;
  while (true) {
    yield arr[index++ % arr.length];
  }
}

const lifts = ['squat', 'bench', 'deadlift', 'press'];
const nextLiftGenerator = repeatedArray(lifts);

const numWeeks = 3;
const daysPerWeek = 6;

const totalNumSessions = numWeeks * daysPerWeek;

// This creates an empty array of totalNumSessions length
// for me to map over
const cycle = [...Array(totalNumSessions)].map(() => ({
  lift: nextLiftGenerator.next().value,
}));
```

Here, the code is more declarative and readable. We abstracted the index-tracking logic into a general-purpose utility function called `repeatedArray`. The `function *` syntax tells JavaScript that this is a generator function. All we have to do is ask for the next item in the “repeated array” and our generator gives it to us. The best part is **we don’t have to worry about how it’s happening outside of our generator function**.

Here’s what’s happening:

`repeatedArray` returns an **iterator** object *for the repeatedArray function itself* (read that twice) when we call it on line 9. The iterator is stored in a variable named `nextLiftGenerator`. It’s important to understand that the code in the function hasn’t been executed at this point. The function is only executed when we call the `next()` function on the `nextLiftGenerator` iterator, and it’s only executed up until it hits a `yield`. Our generator gives us the value, then waits until the next call to continue execution until it hits another `yield`, then returns that value. Make sense? That’s it!

This is obviously a very simple example, but hopefully it helped you understand how generators work, and also why generators are such a powerful feature in JavaScript.