function *withReturn() {
  let x = yield 1;
  return x + 2;
}

let func = withReturn();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 3, done: true}
func.next();
// -> {value: undefined, done: true}
