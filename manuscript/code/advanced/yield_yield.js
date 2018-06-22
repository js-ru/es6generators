function *manyYields() {
  yield yield yield 1;
}

debug(manyYields());
// Output 1, undefined, undefined
