function *multipleYieldStars() {
  yield* [1, 2, 3];
  yield 'x';
  yield* 'hello';
}

debug(multipleYieldStars());
// -> Output 1, 2, 3, 'x', 'h', 'e', 'l', 'l', 'o'
