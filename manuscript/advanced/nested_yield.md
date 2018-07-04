# Вложенные `yield` и `yield*`

Мы можем использовать вложенные `yield` и `yield*` для создания сложных генераций значений.

## Вложенный `yield`

В коде ниже внутреннее выражение `yield` (*под внутренним имеется в виду крайнее правое, выражения `yield` выполняются справа налево — прим. переводчика*) генерирует значение `1`, затем среднее выражение `yield` генерирует значение `yield 1` — `undefined`, и наконец, внешнее выражение `yield` генерирует значение `yield yield 1` — `undefined`.

```js
function *manyYields() {
  yield yield yield 1;
}

debug(manyYields());
// Выведет 1, undefined, undefined
```

## Вложенные `yield` и `yield*`

В коде ниже генератор `oneToThree` сначала генерирует три значения `1`, `2` и `3`, а затем его значение `undefined` генерируется выражением `yield`.

```js
function *oneToThree() {
  yield* [1, 2, 3];
}

function *values() {
  yield yield* oneToThree();
}

debug(values());
// -> Выведет 1, 2, 3, undefined
```
