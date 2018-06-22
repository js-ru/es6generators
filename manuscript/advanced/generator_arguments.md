# Arguments of generator functions

Like other normal functions, generator functions can take arguments. These arguments can be used in `yield` expressions inside the generator functions.

In the code below, `seq` is a generator function with arguments `start` and `number`. `start` means the start number of generated values and `number` means the total number of generated values.

```js
function *seq(start = 0, number = 10) {
  while (number-- > 0) {
    yield start++;
  }
}

debug(seq());
// -> Output values from 0 to 9

debug(seq(3));
// -> Output values from 3 to 12

debug(seq(3, 5));
// -> Output values from 3 to 7
```
