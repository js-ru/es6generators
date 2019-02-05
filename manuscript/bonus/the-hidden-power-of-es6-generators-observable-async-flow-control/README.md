# The Hidden Power of ES6 Generators: Observable Async Flow Control

*Перевод статьи Eric Elliott: [The Hidden Power of ES6 Generators: Observable Async Flow Control](https://medium.com/javascript-scene/the-hidden-power-of-es6-generators-observable-async-flow-control-cfa4c7f31435)*

*Дата публикации: 21.05.2016*

![Nautilus Shell — Dave Spindle (CC-BY-NC-2.0)](images/fibonacci.jpeg)

In [7 Surprising Things I Learned Writing a Fibonacci Generator in JavaScript](https://medium.com/javascript-scene/7-surprising-things-i-learned-writing-a-fibonacci-generator-4886a5c87710), I covered one obvious use-case for ES6 generator functions: producing iterable sequences of values one at a time. If you haven’t read that yet, you should. Iterables are the foundation of a lot of things in ES6+, and it’s going to be important for you to understand how they work.

But in that article, I intentionally sidestepped another major use-case for generators. Arguably, the primary use case: Asynchronous flow control.

### Async / Await

You may have heard of the as-yet not officially standard async/await proposal for JavaScript.

It did not make it into ES6. It will not make it into ES2016. It could become standard in ES2017, and then we’ll need to wait for all the JS engine implementations to land before we can use it. (Note: it works in Babel now, but that’s no guarantee. Tail call optimization worked in Babel for several months but got subsequently removed).

In spite of the wait, you’ll still find a bunch of articles talking about async/await. Why?

It can turn code like this:

```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const promiseFunc = () => new Promise((resolve) => {
  fetchSomething().then(result => {
    resolve(result + ' 2');
  });
});

promiseFunc().then(res => console.log(res));
```

Into code like this:

```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

async function asyncFunction() {
  const result = await fetchSomething(); // returns promise

  // waits for promise and uses promise result
  return result + ' 2';
}

asyncFunction().then(result => console.log(result));
```

Notice that in the first version, our promise-based function has an extra layer of nesting. The async/await version looks like regular, synchronous code, but it’s not. It yields the promise and exits the function, freeing the JS engine to do other things, and when the promise from `fetchSomething()` resolves, the function resumes, and the resolved promise value is assigned to `result`.

It’s asynchronous code that _looks and feels synchronous_. For JavaScript programmers who do a ton of asynchronous programming every day, this is basically the holy grail: All of the performance benefits of asynchronous code with none of the cognitive overhead.

What I’d like to take a deeper look at is how async / await might use generators under the hood… and how you can use them for synchronous style flow control right now, today, _without waiting for async / await to arrive_.

### Generator Review

Generator functions are a new feature in ES6 that allow a function to _generate many values over time_ by returning an object which can be iterated over… an iterable with a `.next()` method that returns objects like this:

```js
{
  value: Any,
  done: Boolean
}
```

The `done` property indicates whether or not the generator has yielded its last value.

The iterator protocol is used by a lot of things in JavaScript, including the new `for…of` loop, the array rest/spread operator, and so on.

```js
function* foo() {
  yield 'a';
  yield 'b';
  yield 'c';
}

for (const val of foo()) {
  console.log(val);
}
// a
// b
// c

const [...values] = foo();
console.log(values); // ['a','b','c']
```

### Talking Back to Generators

Here’s where things get really fun. Communication with generators can happen in both directions. In addition to receiving values from generators, you can inject values into the generator function. The iterator `.next()` method can take values to be assigned.

```js
function* crossBridge() {
  const reply = yield 'What is your favorite color?';
  console.log(reply);
  if (reply !== 'yellow') return 'Wrong!'
  return 'You may pass.';
}

{
  const iter = crossBridge();
  const q = iter.next().value; // Iterator yields question
  console.log(q);
  const a = iter.next('blue').value; // Pass reply back into generator
  console.log(a);
}

// What is your favorite color?
// blue
// Wrong!


{
  const iter = crossBridge();
  const q = iter.next().value;
  console.log(q);
  const a = iter.next('yellow').value;
  console.log(a);
}

// What is your favorite color?
// yellow
// You may pass.
```

There are a couple other ways to communicate to generators. You can throw errors at them. Instead of calling next, you can call `iter.throw(error)`, for example, to communicate that something went wrong fetching data for the generator. You can also force the generator to return with `iter.return()`.

Both of those might come in handy to add error handling to flow control code.

### Generators + Promises = The Holy Grail

What if there was a function wrapping that generator that could detect when you yield a promise, wait for it to resolve, and then pass the resolved value back into the generator with the subsequent `.next()` call?

Then you could write async/await style code like this:

```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const asyncFunc = gensync(function* () {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
});

// Call the async function and pass params.
asyncFunc('param1', 'param2', 'param3')
  .then(val => console.log(val));
```

It turns out that a library like that already exists. It’s called **[Co.js](https://github.com/tj/co)**. But instead of teaching you how to use Co, let’s try to figure out how we could write something like that ourselves. Looking at the `crossBridge()` example above, it looks like it should be pretty easy.

We’ll start with a simple `isPromise()` function:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';
```

Next, we’ll need a way to iterate through the generator’s `.next()` calls, unwrap the promises, and wait for them to resolve before calling `.next()` again. Here’s a straightforward approach with no error handling. This is just a demonstration of the idea. You don’t want to use this in production — your errors would get swallowed, and it would be very hard to debug what’s going on:

```js
const next = (iter, callback, prev = undefined) => {
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};
```

As you can see, we’re passing in a callback to return the final value. We communicate with the generator by passing the previous value into the `.next()` call at the top of the function. That’s what allows us to assign the result of the previous `yield` call to identifier:

```js
const next = (iter, callback, prev = undefined) => {
  // 2. The yielded value is extracted by calling
  // .next(). We pass the previous value back into
  // the generator for assignment.
  const item = iter.next(prev);
  const value = item.value;

  // 4. The final value gets passed to the callback.
  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};

const asyncFunc = gensync(function* () {
  // 1. yield value gets passed to the iterator.
  // The function exits at the yield call time,
  // and the `result` assignment doesn't happen
  // until the generator is resumed.
  const result = yield fetchSomething();

  // 3. Does not run until .next() is called again.
  // `result` will contain the value passed into
  // the previous `.next()` call.
  yield result + ' 2';
});
```

Of course, none of this works until you kick it all off — and what about the promise that actually returns the final value?

```js
// Returns a promise and kicks things
// off with the first `next()` call.
// The callback resolves the promise.
const gensync = (fn) =>
    (...args) => new Promise(resolve => {
  next(fn(...args), val => resolve(val));
});
```

Let’s take a look at all of it together… the whole thing is about 22 lines of code, excluding the usage example:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';

const next = (iter, callback, prev = undefined) => {
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};

const gensync = (fn) =>
    (...args) => new Promise(resolve => {
  next(fn(...args), val => resolve(val));
});



/* How to use gensync() */

const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const asyncFunc = gensync(function* () {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
});

// Call the async function and pass params.
asyncFunc('param1', 'param2', 'param3')
  .then(val => console.log(val)); // 'future value 2'
```

Now, if you want to start using this technique in your code, definitely use [Co.js](https://github.com/tj/co), instead. It has the error handling you’ll need (which I only skipped to avoid cluttering the example), it’s production tested, and it has a couple other nice features.

### From Promises to Observables

The example above is interesting, and Co.js is indeed useful to simplify asynchronous flow control. There’s just one problem: It returns a promise. As you’re probably aware, **a promise can only emit a single value or rejection…**

A generator is capable of emitting many values over time. What else do we know about that can emit many values over time? An observable. You may recall from [7 Surprising Things I Learned Writing a Fibonacci Generator in JavaScript](https://medium.com/javascript-scene/7-surprising-things-i-learned-writing-a-fibonacci-generator-4886a5c87710):

> Initially, I was very excited about generators, but now that I’ve been living with them for a while, I haven’t found a lot of good use cases for generators in my real application code. For most use-cases I might use generators for, I reach for [RxJS](https://github.com/Reactive-Extensions/RxJS) instead because of its much richer API.

Because (_unlike a generator function_) a promise can only emit one value, and (_like a generator function_) an observable can emit many, I personally believe that the observable API is a much better fit for async functions than a promise.

#### What’s an observable?

![](images/hidden-power-1.png)

The table above is from the [GTOR: A General Theory of Reactivity](https://github.com/kriskowal/gtor), by Kris Kowal. It breaks things down neatly across space & time. Values that can be pulled synchronously consume space (values in memory), but are detached from time. They are **pull APIs**.

Values which depend on some event in time can’t be consumed synchronously. You must wait for the values to be produced before you can consume them. Such values are **push APIs**, and always have some kind of subscription or notification mechanism. In JavaScript, that generally takes the form of a callback function.

When dealing with future values, you need to be notified when a value becomes available. That’s the **push**.

A promise is a push mechanism that calls some code after the promise has been resolved or rejected with a single value.

An observable is like a promise, but it calls some code every time a new value becomes available, and _can emit many values over time_.

The core feature of an observable is a `.subscribe()` method which takes three values:

- **onNext** — Called each time the observable emits a value.
- **onError** — Called when the observable encounters an error or fails to generate the data to emit. After an error, no further values will be emitted, and `onCompleted` will not be called.
- **onCompleted** — Called after it has called `onNext` for the final time, but only if no errors were encountered.

So, if we want to implement an observable API for our synchronous-style async functions, we just need a way to pass in those parameters. Let’s take a crack at that, leaving `onError` for later:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';

const next = (iter, callbacks, prev = undefined) => {
  const { onNext, onCompleted } = callbacks;
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) {
    return onCompleted();
  }

  if (isPromise(value)) {
    value.then(val => {
      onNext(val);
      setImmediate(() => next(iter, callbacks , val));
    });
  } else {
    onNext(value);
    setImmediate(() => next(iter, callbacks, value));
  }
};

const gensync = (fn) => (...args) => ({
  subscribe: (onNext, onError, onCompleted) => {
    next(fn(...args), { onNext, onError, onCompleted });
  }
});


/* How to use gensync() */

const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const myFunc = function* (param1, param2, param3) {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
  yield param1;
  yield param2;
  yield param3;
}

const onNext = val => console.log(val);
const onError = err => console.log(err);
const onCompleted = () => console.log('done.');

const asyncFunc = gensync(myFunc);

// Call the async function and pass params.
asyncFunc('a param', 'another param', 'more params!')
  .subscribe(onNext, onError, onCompleted);
// future value
// future value 2
// a param
// another param
// more params!
// done.
```

I really like this version, because it feels a lot more versatile to me. In fact, I like it so much, I’ve fleshed it out a bit, renamed it to Ogen, added error handling and a true Rx Observable object (which means you can `.map()`, `.filter()` and `.skip()` to your heart’s content. [Among other things](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/main/rx.md#observable-instance-methods).

Check out [Ogen on GitHub](https://github.com/ericelliott/ogen).

There are lots of ways observables can improve your asynchronous flow control, which is probably the main reason I haven’t used generators a lot more, but now that I can mix and match synchronous-style code and observables seamlessly with Ogen, maybe I’ll start to use generators a whole lot more.