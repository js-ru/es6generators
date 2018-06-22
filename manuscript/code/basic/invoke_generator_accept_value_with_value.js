let func = doMath();
func.next();
// -> {value: 1, done: false}
func.next(1);
// -> {value: 11, done: false}
func.next(2);
// -> {value: 20, done: false}
func.next(3);
// -> {value: undefined, done: true}
