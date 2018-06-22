function *sample() {
  let x = yield 1;
  let y = yield x + 1;
  yield y * 10;
}

let func = sample();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 2, done: false}
func.throw('hello');
// -> Uncaught hello
func.next();
// -> {value: undefined, done: true}
