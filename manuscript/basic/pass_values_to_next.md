# Pass values to `next()`

Let's start from another simple generator function `doMath`. If we just look at the code, we may think that after invoking `next()` on the generator object, the value of `x` should be `1`, the value of `y` should be `11` and the value of `z` should be `110`. It's just simple math, right???

```js
function *doMath() {
  let x = yield 1;
  let y = yield x + 10;
  let z = yield y * 10;
}
```

But the actual result doesn't match what we would expect. As shown in the code below, the values are `1`, `NaN` and `NaN`.

```js
let func = doMath();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: NaN, done: false}
func.next();
// -> {value: NaN, done: false}
func.next();
// -> {value: undefined, done: true}
```

The key to understanding the actual result is that value passed to `next()` invocation is the actually used value of last `yield` expression. Since we didn't pass any argument when invoking `next()`, so the value of each `yield` expression is actually `undefined`.

For the first `next()` invocation, there is no last `yield` expression, so the value is actually ignored. For the second `next()` invocation, value of last `yield` expression, i.e. `yield 1` is set to `undefined`, which sets `x` to `undefined`, then sets the result of `yield x + 10` to `NaN`. For the third `next()` invocation, value of last `yield` expression, i.e. `yield x + 10` is set to `undefined`, which sets `y` to `undefined`, then sets the result of `yield y * 10` to `NaN`.

Now we can try to pass a value when invoking `next()` method on a generator object. In the code below, the second `next()` invocation `func.next(1)` passes `1` to the generator object, so value `1` is set as the value of `yield 1`, which sets `x` to `1`, then the result of this `next()` will be `11`. For the third `next()` invocation `func.next(2)`, `2` is passed as the value of `yield x + 10`, which sets `y` to `2`, then the result of this `next()` will be `20`.

```js
let func = doMath();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 11, done: false}
func.next(2);
// -> {value: 20, done: false}
func.next(3);
// -> {value: undefined, done: true}
```
