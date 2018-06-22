function *oneToThree() {
  yield* [1, 2, 3];
}

debug(oneToThree());
// -> Output 1, 2, 3
