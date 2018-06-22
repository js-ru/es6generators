# Basic generators {#basic-generators}

Let's start with a simple generator function. The difference between a generator function and a normal function declaration is the `*` between `function` and the function name.

```js
function *sample() {
  yield 1;
  yield 2;
  yield 3;
}
```

I> We can either use `function* sample()` or `function *sample()` or `function * sample()`. It's up to the development team to choose the desired format.
In this book, `function *sample()` is used as it's the default configuration in [ESLint](http://eslint.org/docs/rules/generator-star-spacing).

Generator objects can return multiple values when `next()` method is invoked. Those values are specified using `yield` keyword. In the generator function above, three `yield` expressions can generate three values `1`, `2` and `3` when `next()` method of a generator object is invoked.

```js
let func = sample();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.next();
// -> {value: 3, done: false}
func.next();
// -> {value: undefined, done: true}
func.next();
// -> {value: undefined, done: true}
```

In the code above, invoking the generator function `sample` generates a new generator object `func`. Execution of generator object `func` is initially suspended. When `next` method is invoked on the `func` object, it starts execution and runs to the first `yield` expression and returns the value `1` to the caller. The return value is an object with two properties: `value` and `done`. `value` contains the return value of `yield` expression, `done` can be used to check if there are more values to get. `done` property is `false` for the first three invocations of `next` method. For the fourth invocation, `done` property is set to `true`, which means there are no values anymore.

## Suspend & resume execution

The power of generators comes from the ability to suspend and resume execution of generator objects. Each generator object can be viewed as a state machine. Each instance of the same generator function maintains its own state. Invoking `next()` on the generator object triggers state transition inside the object, which causes the object runs to the next `yield` expression. This continues until no more `yield` expressions found.

In the code below, two generator objects `func1` and `func2` maintain their own internal states. Invoking `next()` on one object doesn't affect the state of the other object.

```js
let func1 = sample();
let func2 = sample();
func1.next();
// -> {value: 1, done: false}
func2.next();
// -> {value: 1, done: false}
func1.next();
// -> {value: 2, done: false}
```

## Check types of generator functions and generator objects

We can use `Object.prototype.toString` to check the types of generator functions and generator objects.

```js
function *sample() {

}

Object.prototype.toString.apply(sample);
// -> "[object GeneratorFunction]"

Object.prototype.toString.apply(sample());
// -> "[object Generator]"
```
