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
