var result;

function loop(iterable) {
  for (let value of iterable) {
    //ignore
  }
}

function *oneToThree() {
  result = yield* [1, 2, 3];
}

loop(oneToThree());
console.log(result);
// -> undefined
