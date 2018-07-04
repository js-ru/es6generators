## Преобразование `async/await`

У Babel есть [плагин async-to-generator](https://babeljs.io/docs/plugins/transform-async-to-generator/), преобразующий функции `async` в функции-генераторы. Мы будем использовать простое приложение на Node.js, чтобы продемонстрировать использование этого плагина Babel.

В приведённом ниже коде показан файл `.babelrc`.

```json
{
  "plugins": [
    "transform-es2015-modules-commonjs",
    "syntax-async-functions",
    "transform-async-to-generator"
  ]
}
```

Учитывая приведенный ниже JavaScript-код,

```js
async function foo() {
  await bar();
}
```

После применения плагина вывод будет такой, как показан ниже. Преобразование очевидное и зависит от вспомогательного метода `_asyncToGenerator`. Функция `async` преобразуется в функцию генератора, а `await` превращается в `yield`. Вспомогательный метод `_asyncToGenerator` отвечает за преобразование функций-генераторов в обычные функции, которые возвращают `Promise`.

```js
"use strict";

let foo = (() => {
  var _ref = _asyncToGenerator(function* () {
    yield bar();
  });

  return function foo() {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }
```

Из [исходного кода](https://github.com/babel/babel/blob/master/packages/babel-helpers/src/helpers.js#L244) функции `asyncToGenerator` мы видим, что она преобразует функцию-генератор в цепочку из `Promise`.