function *moreValues() {
  yield* oneToThree();
}

debug(moreValues())
// -> Output 1, 2, 3
