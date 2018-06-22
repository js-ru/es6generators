const Promise = require('bluebird');
const createTask = require('./createTask');
const values = require('./values');

function runTask(values) {
  return Promise.map(values, value => createTask(value, 1000), { concurrency: 1 });
}

runTask(values);
