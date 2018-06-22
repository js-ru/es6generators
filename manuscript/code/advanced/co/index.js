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
// -> Output 3 after about 1s delay
