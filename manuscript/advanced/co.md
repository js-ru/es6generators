# co {#co}

Функции-генераторы также могут использоваться для управления потоком выполнения. Используя выражение `yield`, мы можем контролировать, когда выполнение объекта-генератора должно быть приостановлено. В это время другой код имеет возможность запуститься и выбрать лучший момент для возобновления выполнения. Выражения `yield*` позволяют делегировать другим объектам-генераторам или итерируемым объектам, которые могут создавать сложные вложенные или рекурсивные потоки выполнения.

Функции-генераторы особенно полезны в комбинации с [`Promise`] (https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise). Как описано на MDN,

> Объект Promise используется для асинхронных вычислений. Promise представляет значение, которое может быть доступно сейчас, или в будущем, или никогда.


Если значением выражения `yield` является объект `Promise`, то мы можем приостановить выполнение объекта-генератора, пока ждём завершения `Promise`. Когда `Promise` выполнен, мы можем продолжить выполнение объекта-генератора с его результатом в качестве значения выражения `yield`. В противном случае мы можем завершить объект-генератор с отклонённой ошибкой `Promise`.

Чтобы поддерживать сценарии такого рода, нам понадобится библиотека [co](https://github.com/tj/co). В коде ниже `timeoutToPromise` — это вспомогательная функция, которая создаёт объект `Promise`, используя `setTimeout`. Функция-генератор `calculate` использует выражение `yield` и объект `Promise`, созданный функцией `timeoutToPromise`. `co(calculate, 1, 2)` превращает функцию-генератор в объект `Promise`.

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
// -> Выведет 3 после задержки около 1 секунды
```

Ниже показан пример использования `co` с функциями-генераторами, в которых есть выражения `yield` с другими объектами-генераторами. `value` — это функция-генератор, которая принимает параметр `v` в качестве источника для генерации двух случайных значений `v1` и `v2`. `yield value(1)` в функции `calculate` использует объект-генератор `value(1)` для получения результата выражения `yield`.

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
// -> Выведет случайное число
```
