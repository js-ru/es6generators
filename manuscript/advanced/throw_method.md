# Метод `throw`

Объект-генератор имеет метод `throw`, чтобы передать в него значение и бросить исключение внутри объекта-генератора. Оба метода `throw` и `next` могут посылать значения в объекты-генераторы и менять их поведение. Значение, переданное в метод `next` становится результатом последнего выполненного выражения `yield`, а значение, переданное с помощью метода `throw`, заменяет последнее выражение `yield` на выражение `throw`.

В коде ниже, когда мы передаём `hello` в объект-генератор с помощью `throw('hello')`, выбрасывается непойманное исключение и объект-генератор завершается. Когда вызывается `func.throw('hello')`, последнее выполненное выражение `yield`, а именно `yield x + 1`, заменяется на `throw 'hello'`. Т.к. брошенное исключение не поймано, оно обрабатывается движком JavaScript.

```js
function *sample() {
  let x = yield 1;
  let y = yield x + 1;
  yield y * 10;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 2, done: false}
func.throw('hello');
// -> Uncaught hello
func.next();
// -> {value: undefined, done: true}
```

Хотя метод `throw()` может принимать значения любого типа, для упрощения отладки рекомендуется передавать в него объект [`Error`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Error), например, `throw(new Error('boom!'))`.

Для обработки ошибок мы можем использовать `try-catch` в функции-генераторе. В коде ниже, когда вызывается `func.throw(new Error('boom!'))`, последнее выполненное выражение `yield` заменяется на `throw new Error('boom!')`. Конструктция `try-catch` ловит выброшенный объект исключения, поэтому код продолжает выполняться до следующего выражения `yield`, т.е. до `yield 3`.

```js
function *sample() {
  yield 1;
  try {
    yield 2;
  } catch (e) {
    console.error(e);
  }
  yield 3;
  yield 4;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.throw(new Error('boom!'));
// -> Error: boom!
// -> {value: 3, done: false}
func.next();
// -> {value: 4, done: false}
```

Если объект-генератор поймал и обработал значение, переданное в `throw()`, он может продолжить генерировать все оставшиеся значения. В противном случае, он завершится с необработанной ошибкой.
