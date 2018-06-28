# `return` method
# Метод `return`

Объект-генератор имеет метод `return` для возврата значения и завершения генератора. Это поведение похоже на использование  выражения `return` [внутри генератора](#return-in-generators).
A generator object  has a `return` method to return given value and finish the generator. This behavior is similar with using `return` statement [inside of a generator](#return-in-generators).

Возьмём, к примеру, функцию-генератор, показанную ниже.
Given the same `values` generator function shown below,

```js
function *values() {
  yield 'a';
  yield 'b';
  yield 'c';
}
```

Мы можем видеть, как вызов метода `return` завершает объект-генератор. Первый вызов `next()` возвращает первое значение `'a'`, затем `func.return('d')` возвращает значение `'d'` и завершает генератор, т.е. свойство `done` становится равным `true`.
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

Метод `return` может вызываться несколько раз. Каждый вызов вернёт значение, переданное в метод `return()`.
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
