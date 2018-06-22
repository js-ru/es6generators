function *sample() {
  yield 1;
  try {
    yield 2;
  } catch (e) {
    console.error(e);
  }
  yield 3;
  yield 4;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.throw(new Error('boom!'));
// -> Error: boom!
// -> {value: 3, done: false}
func.next();
// -> {value: 4, done: false}
