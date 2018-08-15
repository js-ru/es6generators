# Javascript - Generator-Yield/Next & Async-Await

*Перевод статьи Deepak Gupta: [Javascript - Generator-Yield/Next & Async-Await](https://codeburst.io/javascript-generator-yield-next-async-await-e428b0cb52e4)*

*Дата публикации: 09.06.2018*

![](javascript-generator-yield-next-async-await-1.jpeg)

## Generator (ES6)-

> Functions that can return multiple values at different time interval, as per the user demands and can manage its internal state are generator functions. A function becomes a GeneratorFunction if it uses the [`function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) syntax.

They are different from the normal function in the sense that normal function run to completion in a single execution where as generator function can be paused and resumed, so they do run to completion but the trigger remain in our hand. They allow better execution control for asynchronous functionality but that does not mean they cannot be used as synchronous functionality.

> Note: When generator function are executed it returns a new Generator object.

The pause and resume are done using yield&next. So lets look at what are they and what they do.

## Yield/Next-

> The `yield` keyword pauses generator function execution and the value of the expression following the `yield` keyword is returned to the generator's caller. It can be thought of as a generator-based version of the return keyword.

The `yield` keyword actually returns an `IteratorResult` object with two properties, `value` and `done`. ([Don’t know what are iterators and iterables then read here](https://codeburst.io/javascript-es6-iterables-and-iterators-de18b54f4d4)).

> Once paused on a `yield` expression, the generator's code execution remains paused until the generator's `next()` method is called. Each time the generator's `next()` method is called, the generator resumes execution and return the [iterator](https://codeburst.io/javascript-es6-iterables-and-iterators-de18b54f4d4) result.

pheww..enough of theory, lets see an example.

```js
function* UUIDGenerator() {
    let d, r;
    while(true) {
        yield 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            r = (new Date().getTime() + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
    }
};
```

Here, UUIDGenerator is an generator function which calculate the UUID using current time an a random number and return us a new UUID every time its executed.

To run above function we need to create a generator object on which we can call `next()`

```js
const UUID = UUIDGenerator();
// UUID is our generator object

UUID.next() 
// return {value: 'e35834ae-8694-4e16-8352-6d2368b3ccbf', done: false}
```

UUID.next() this will return you the new UUID on each UUID.next() under value key and done will always be false as we are in infinite loop.

> Note: We pause above the infinite loop, which is kind of cool and at any “stopping points” in a generator function, not only can they yield values to an external function, but they also can receive values from outside.

There are lot of practical implementation of generators as one above and lot of library that heavily use it, [co](https://github.com/tj/co) , [koa](https://koajs.com/) and [redux-saga](https://github.com/redux-saga/redux-saga) are some examples.

## Async/Await (ES7)

![](javascript-generator-yield-next-async-await-2.jpeg)

Traditionally, callbacks were passed and invoked when an asynchronous operation returned with data which are handled using Promise.

> Async/Await is special syntax to work with promises in a more comfort fashion which is surprisingly easy to understand and use.

**Async** *keyword* is used to define an *asynchronous function*, which returns a [`AsyncFunction`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction) object.

Await keyword is used to pause async function execution until a `Promise` is fulfilled, that is resolved or rejected, and to resume execution of the `async` function after fulfillments. When resumed, the value of the `await` expression is that of the fulfilled `Promise`.

Key points:

1. Await can only be used inside an async function.
2. Functions with the async keyword will always return a promise.
3. Multiple awaits will always run in sequential order under a same function.
4. If a promise resolves normally, then await promise returns the result. But in case of a rejection it throws the error, just if there were a throw statement at that line.
5. Async function cannot wait for multiple promises at the same time.
6. Performance issues can occur if using await after await as many times one statement doesn’t depend on the previous one.

So far so good, now lets see a simple example:

```js
async function asyncFunction() {

  const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve("i am resolved!"), 1000)
  });

  const result = await promise; 
  // wait till the promise resolves (*)

  console.log(result); // "i am resolved!"
}

asyncFunction();
```

The `asyncFunction` execution “pauses” at the line `await promise` and resumes when the promise settles, with `result` becoming its result. So the code above shows “`i am resolved!`” in one second.

* * *

## Generator and Async-await — Comparison

1. *Generator functions/yield* and *Async functions/await* can both be used to write asynchronous code that “waits”, which means code that looks as if it was synchronous, even though it really is asynchronous.
1. *Generator function* are executed **yield by yield** i.e one yield-expression at a time by its iterator (the `next` method) where as *Async-await*, they are executed sequential **await by await**.
1. *Async/await* makes it easier to implement a particular use case of *Generators*.
1. The return value of *Generator* is always **{value: X, done: Boolean}** where as for *Async function* it will always be a **promise** that will either resolve to the value X or throw an error.
1. *Async function* can be decomposed into *Generator and promise* implementation which are good to know stuff.