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
