# Sequence generation

Generator functions are very useful when generating complex sequences. We can encapsulate the generation logic in the function and shield the consumer from internal details.

In the code below, generator function `numbers` has a complicated logic about generating values in the sequence.

```js
function *numbers() {
  for (let i = 0; i < 20; i++) {
    if (i < 5) {
      yield i;
    } else if (i < 10 && i % 2 === 0) {
      yield i * 2;
    } else if (i < 15 && i % 3 === 0) {
      yield i * 3;
    } else if (i % 7 === 0) {
      yield i * 7;
    }
  }
}

debug(numbers());
// -> Output numbers: 0, 1, 2, 3, 4, 12, 49, 16, 27, 36, 98
```

For more complicated scenarios, we can also use `yield*` to combine sequences. Suppose we have a system which stores users information in both file system and database, we can use following code to return a sequence of all users.

```js
function *loadUsers() {
  yield 'annoymous';
  yield* loadFromFile();
  yield* loadFromDb();
}
```

I> In real-world cases, `loadUsers` and `loadFromDb` usually return `Promise` objects. Then [co](#co) should be used.
