# `return` in generators {#return-in-generators}

In the generator function, we can also use `return` statement. The returned value is also passed to the caller of a generator object's `next()` method. `return` also finishes execution of generator object, i.e. `done` property is set to `true`. In the code below, the return value of second `next(1)` invocation is the value of `return` statement, i.e. `x + 2`.

```js
function *withReturn() {
  let x = yield 1;
  return x + 2;
}

let func = withReturn();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 3, done: true}
func.next();
// -> {value: undefined, done: true}
```

## Infinite values

It's possible for a generator object to generate an infinite number of values, i.e. `done` property is always `false`. For example, we can create a generator which generates infinite integer numbers starting from `0`. In this case, we can use `return` to finish generator objects.

In the code below, `loop` keeps generating incremental values in a `while` loop. When a truthy value is passed to `next()` as the value of `shouldExit`, the last value is returned and generator object is finished.

```js
function *loop() {
  var count = 0;
  while (true) {
    let shouldExit = yield count++;
    if (shouldExit) {
      return count++;
    }
  }
}
```

As shown in the code below, three values are generated using `next()`. The forth `next(true)` invocation finishes the generator object `func`.

```js
let func = loop();
func.next();
// -> {value: 0, done: false}
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.next(true);
// -> {value: 3, done: true}
func.next();
// -> {value: undefined, done: true}
```
