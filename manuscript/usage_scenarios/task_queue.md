# Fail-fast task queue
# Очередь задач с ранним оповещением о сбоях

Мы можем использовать функции-генераторы для создания простой очереди задач с ранним оповещением о сбоях (fail-fast) и избежать рекурсивных вызовов. Если очередь реализует схему раннего оповещения о сбоях, то в случае сбоя в одной задаче следующие задачи не выполняются. 

Мы используем следующий код для создания задач с помощью `setTimeout` и `Promise`. В задаче происходит сбой, если значение `value` больше или равно `5`.

```js
module.exports = function createTask(value, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value < 5) {
        console.log('value => ' + value);
        resolve(value);
      } else {
        reject(new Error('Значение слишком большое!'));
      }
    }, timeout);
  });
}
```

Значения для тестирования — обычные числа.

```js
module.exports = [1, 2, 3, 4, 5, 6, 7];
```

Мы можем реализовать очередь задач, используя рекурсивные вызовы.

```js
const createTask = require('./createTask');
const values = require('./values');

function runTask(values) {
  if (values.length > 0) {
    createTask(values.shift(), 1000).then(function(result) {
      runTask(values);
    }, function(error) {
      console.error(error);
    });
  }
}

runTask(values);
```

Мы также можем реализовать её с помощью функций-генераторов и `co`.

```js
const co = require('co');
const createTask = require('./createTask');
const values = require('./values');

function runTask(values) {
  co(function *() {
    while (values.length > 0) {
      yield createTask(values.shift(), 1000);
    }
  });
}

runTask(values);
```
