# `return` method

A generator object  has a `return` method to return given value and finish the generator. This behavior is similar with using `return` statement [inside of a generator](#return-in-generators).

Given the same `values` generator function shown below,

```js
function *values() {
  yield 'a';
  yield 'b';
  yield 'c';
}
```

We can see how invoking `return` method finishes the generator object. The first `next()` invocation returns the first value `'a'`, then `func.return('d')` returns value `'d'` and finishes the generator, i.e. `done` property is set to `true`.

```js
let func = values();
func.next();
// -> {value: "a", done: false}
func.return('d');
// -> {value: "d", done: true}
func.next();
// -> {value: undefined, done: true}
```

`return` method can be invoked multiple times. Each invocation returns the value passed to `return()` method.

```js
let func = values();
func.next();
// -> {value: "a", done: false}
func.next();
// -> {value: "b", done: false}
func.next();
// -> {value: "c", done: false}
func.next();
// -> {value: undefined, done: true}
func.return('d');
// -> {value: "d", done: true}
func.return('e');
// -> {value: "e", done: true}
```
