## Transform `async/await`

Babel has a [async to generator plugin](https://babeljs.io/docs/plugins/transform-async-to-generator/) which transforms `async` functions into generator functions. We'll use a simple NodeJS application to demonstrate the usage of this Babel plugin.

The code below shows the `.babelrc` file.

```json
{
  "plugins": [
    "transform-es2015-modules-commonjs",
    "syntax-async-functions",
    "transform-async-to-generator"
  ]
}
```

Given JavaScript code shown below,

```js
async function foo() {
  await bar();
}
```

After applying the plugin, the output is shown as below. The transformation is straightforward and relies on a helper method `_asyncToGenerator`. `async` function is transformed into generator function and `await` is transformed into `yield`. The `_asyncToGenerator` helper is responsible for transforming generator functions into a regular function that returns a `Promise`.

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

From the [source code](https://github.com/babel/babel/blob/master/packages/babel-helpers/src/helpers.js#L216) of `asyncToGenerator`, we can see that it transforms a generator function into a `Promise` chain.
