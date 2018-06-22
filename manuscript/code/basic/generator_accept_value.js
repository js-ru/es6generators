function *doMath() {
  let x = yield 1;
  let y = yield x + 10;
  let z = yield y * 10;
}
