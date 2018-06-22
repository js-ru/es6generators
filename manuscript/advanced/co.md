# co {#co}

Generator functions can also be used to control code execution flow. By using `yield` expressions, we can control when the execution of a generator object should be suspended. When the execution of a generator object is suspended, other code can have the chance to run and choose the best time to resume the execution. `yield*` expressions allow the delegation to other generator objects or iterable objects, which can create complicated nested or recursive execution flows.

Generator functions are most useful when combining with [`Promise`s](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). As described in MDN,

> The Promise object is used for asynchronous computations. A Promise represents a value which may be available now, or in the future, or never.

If the value of a `yield` expression is a `Promise` object, then we can suspend the execution of the generator object when waiting for the `Promise` to be resolved. When the `Promise` is fulfilled, we can resume the execution of the generator object with the fulfilled value as the value of the `yield` expression. Otherwise, we can finish the generator with the rejected error.

To support this kind of scenarios, we need to use the library [co](https://github.com/tj/co). In the code below, `timeoutToPromise` is a helper method that creates a `Promise` object using `setTimeout`. Generator function `calculate` uses `yield` expression and the `Promise` object created by `timeoutToPromise`. `co(calculate, 1, 2)` turns the generator function `calculate` into a `Promise` object.

```js
const co = require('co');

function timeoutToPromise(action, timeout) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(action());
    }, timeout);
  });
}

function *calculate(v1, v2) {
  return yield timeoutToPromise(function() {
    return v1 + v2;
  }, 1000);
}

co(calculate, 1, 2).then(function (value) {
  console.log(value);
}, function (err) {
  console.error(err);
});
// -> Output 3 after about 1s delay
```

Below is an example of using `co` with generator functions which have `yield` expressions with other generator objects. `value` is a generator function which takes the argument `v` as the seed of generating two random values `v1` and `v2`. `yield value(1)` in `calculate` uses a generator object `value(1)` as the target of `yield` expression.

```js
const co = require('co');

function *value(v) {
  return yield {
    v1: v + Math.random() * 100,
    v2: v + Math.random() * 500
  };
}

function *calculate() {
  const values = yield value(1);
  return values.v1 + values.v2;
}

co(calculate).then(function (value) {
  console.log(value);
}, function (err) {
  console.error(err);
});
// -> Output random number
```
