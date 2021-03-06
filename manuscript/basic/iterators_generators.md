# Итераторы и генераторы

Из всего вышеприведённого кода генераторов вы могли подумать, почему мы должны использовать `next()` для получения значений из объектов-генераторов и иметь дело с не интуитивно-понятным форматом возвращаемого значения — `{value: 1, done: false}`. Поэтому встречайте — итераторы.

## Итераторы

Итераторы не по наслышке знакомы разработчикам. Они уже существуют в разных языках программирования с похожими названиями, например, [интерфейс Iterator](https://docs.oracle.com/javase/8/docs/api/java/util/Iterator.html) в Java, [класс Enumerator](https://ruby-doc.org/core-2.3.1/Enumerator.html) в Ruby и [типы итераторов](https://docs.python.org/2/library/stdtypes.html#iterator-types) в Python. Итераторы могут использоваться для перебора элементов в коллекции. Итераторы сохраняют своё внутреннее состояние относительно текущей позиции в целевой коллекции.

[Итератор](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface) в ES6 — это просто объект, который предоставляет метод `next()` для получения следующего элемента в текущей итерации. Метод `next()` должен возвращать объект с двумя свойствами: `value` и `done`. Таким образом, функции-генераторы фактически являются фабриками итераторов.

## Интерфейс Iterable

[Итерируемые (iterables) объекты](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface) — это объекты со свойством `@@iterator`. Значение свойства `@@iterator` — это функция, возвращающая объект Iterator.

Объект-генератор реализует оба интерфейса: *Iterator* и *Iterable*.

## Интерация объектов-генераторов

Поскольку генераторы являются итерируемыми, мы можем использовать другие языковые возможности ES6 для лёгкого взаимодействия с объектами-генераторами. В следующих примерах используется функция-генератор `values`, определённая ниже.

```js
function *values() {
  yield 'a';
  yield 'b';
  yield 'c';
}
```

### Циклы `for-of`

Мы можем использовать цикл `for-of` для простой итерации всех значений в объекте-генераторе.

```js
for (let value of values()) {
  console.log(value);
}
// -> Выведет 'a', 'b' и 'c'
```

### Оператор расширения

Объекты-генераторы также могут использоваться с оператором расширения.

```js
// Операция расширения в литералах массива
[1, ...values(), 2]
// -> [1, "a", "b", "c", 2]

// Операция расширения в вызовах функций
function join(x, y, z) {
  return x + y + z;
}
join(...values());
// -> "abc"
```

### Работа с новыми типами коллекций

Объекты-генераторы могут использоваться для создания новых объектов коллекции, например. `Set`, `WeakSet`, `Map` и `WeakMap`.

```js
let set = new Set(values());
set.size;
// -> 3

set.forEach(function(value) {
  console.log(value);
});
// -> Выведет 1, 2, 3
```
