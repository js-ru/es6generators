# Fail-fast task queue

We can use generator functions to create a simple fail-fast task queue and avoid recursive calls. The task queue is fail-fast, so subsequent tasks shouldn't be executed when a task failed.

We use the following code to create tasks using `setTimeout` and `Promise`. The task fails when `value` is greater than or equals to `5`.

```js
module.exports = function createTask(value, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value < 5) {
        console.log('value => ' + value);
        resolve(value);
      } else {
        reject(new Error('value to large!'));
      }
    }, timeout);
  });
}
```

The values used for testing are simple numbers.

```js
module.exports = [1, 2, 3, 4, 5, 6, 7];
```

We can implement the task queue using recursive calls.

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

We can also implement it using generator functions and `co`.

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
