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
// -> Output random number
