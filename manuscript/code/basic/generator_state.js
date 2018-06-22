let func1 = sample();
let func2 = sample();
func1.next();
// -> {value: 1, done: false}
func2.next();
// -> {value: 1, done: false}
func1.next();
// -> {value: 2, done: false}
