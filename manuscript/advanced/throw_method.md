# `throw` method

A generator object also has a `throw` method to pass a value to it and trigger an exception to throw inside of the generator object. Both `throw` and `next` methods can send values to generator objects and change their behaviors. A value passed using `next` is treated as the result of last `yield` expression, but a value passed using `throw` is treated as replacing last `yield` expression with a `throw` statement.

In the code below, when passing `hello` to the generator object using `throw('hello')`, an uncaught error is thrown and the generator object is finished. When `func.throw('hello')` is invoked, the last `yield` expression `yield x + 1` is replaced with `throw 'hello'`. Since the thrown object is not caught, it's propagated to the JavaScript engine.

```js
function *sample() {
  let x = yield 1;
  let y = yield x + 1;
  yield y * 10;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 2, done: false}
func.throw('hello');
// -> Uncaught hello
func.next();
// -> {value: undefined, done: true}
```

Although it's possible to pass any types of values to `throw()`, it's recommended to pass [`Error`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Error) objects for better debugging, e.g. `throw(new Error('boom!'))`.

We can use `try-catch` in the generator function to handle errors. In the code below, when `func.throw(new Error('boom!'))` is invoked, last `yield` expression `yield 2` is replaced with `throw new Error('boom!')`. The thrown object is caught by `try-catch`. So the execution continues until the next `yield` expression `yield 3`.

```js
function *sample() {
  yield 1;
  try {
    yield 2;
  } catch (e) {
    console.error(e);
  }
  yield 3;
  yield 4;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.throw(new Error('boom!'));
// -> Error: boom!
// -> {value: 3, done: false}
func.next();
// -> {value: 4, done: false}
```

If the value passed by `throw()` is caught and handled by the generator object, it can continue to generate all remaining values. Otherwise, it will finish with a uncaught error.
