let func = doMath();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: NaN, done: false}
func.next();
// -> {value: NaN, done: false}
func.next();
// -> {value: undefined, done: true}
