var result;

function loop(iterable) {
  for (let value of iterable) {
    //ignore
  }
}

function *abc() {
  yield* 'abc';
  return 'd';
}

function *generator() {
  result = yield* abc();
}

loop(generator());
console.log(result);
// -> "d"
