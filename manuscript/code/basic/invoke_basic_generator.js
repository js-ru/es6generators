let func = sample();
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.next();
// -> {value: 3, done: false}
func.next();
// -> {value: undefined, done: true}
func.next();
// -> {value: undefined, done: true}