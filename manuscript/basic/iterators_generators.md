# Iterators & generators

From all the generators code above, you may wonder why we should use `next()` to get values from the generator objects and deal with the nonintuitive return value format `{value: 1, done: false}`. Meet iterators.

## Iterators

Iterators are no strangers to developers. They already exist in different programming languages with similar names, e.g. Java [Iterator](https://docs.oracle.com/javase/8/docs/api/java/util/Iterator.html), Ruby [Enumerator](https://ruby-doc.org/core-2.3.1/Enumerator.html) and Python [Iterator Types](https://docs.python.org/2/library/stdtypes.html#iterator-types). Iterators can be used to iterate over items in a collection. Iterators maintain their own states regarding the current position in the target collection.

An [iterator](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface) in ES6 is just an object which provides a `next()` method to get next item in the current iteration. `next()` method should return an object with two properties: `value` and `done`. So generator functions are actually factories of iterators.

## Iterables

[Iterables](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface) are objects which have property `@@iterator`. The value of `@@iterator` property is a function that returns an Iterator object.

A generator object conforms to both the *Iterator* and *Iterable* interfaces.

## Iterate generator objects

As generators are iterable, we can use other ES6 language features to interact with generator objects easily. Following examples use `values` generator function shown below.

```js
function *values() {
  yield 'a';
  yield 'b';
  yield 'c';
}
```

### `for-of` loops

We can use `for-of` loops to easily iterate all the values in a generator object.

```js
for (let value of values()) {
  console.log(value);
}
// -> Output 'a', 'b' and 'c'
```

### Spread operator

Generator objects can also be used with spread operator.

```js
// Spread operation in array literals
[1, ...values(), 2]
// -> [1, "a", "b", "c", 2]

// Spread operation in function calls
function join(x, y, z) {
  return x + y + z;
}
join(...values());
// -> "abc"
```

### Work with new collection types

Generator objects can be used to create new collection objects, e.g. `Set`, `WeakSet`, `Map` and `WeakMap`.

```js
let set = new Set(values());
set.size;
// -> 3

set.forEach(function(value) {
  console.log(value);
});
// -> Output 1, 2, 3
```
