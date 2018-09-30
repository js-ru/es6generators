# Метод `return`

Объект-генератор имеет метод `return` для возврата значения и завершения генератора. Это поведение похоже на использование выражения `return` [внутри генератора](#return-in-generators).

Возьмём, к примеру, функцию-генератор, показанную ниже.

```js
function *values() {
  yield 'a';
  yield 'b';
  yield 'c';
}
```

Мы можем видеть, как вызов метода `return` завершает объект-генератор. Первый вызов `next()` возвращает первое значение `'a'`, затем `func.return('d')` возвращает значение `'d'` и завершает генератор, т.е. свойство `done` становится равным `true`.

```js
let func = values();

func.next();
// -> {value: "a", done: false}
func.return('d');
// -> {value: "d", done: true}
func.next();
// -> {value: undefined, done: true}
```

Метод `return` можно вызывать несколько раз. Каждый вызов вернёт значение, переданное в метод `return()`.

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
