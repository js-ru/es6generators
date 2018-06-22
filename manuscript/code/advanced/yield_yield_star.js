function *oneToThree() {
  yield* [1, 2, 3];
}

function *values() {
  yield yield* oneToThree();
}

debug(values());
// -> Output 1, 2, 3, undefined
