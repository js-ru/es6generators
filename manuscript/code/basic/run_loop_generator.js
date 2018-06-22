let func = loop();
func.next();
// -> {value: 0, done: false}
func.next();
// -> {value: 1, done: false}
func.next();
// -> {value: 2, done: false}
func.next(true);
// -> {value: 3, done: true}
func.next();
// -> {value: undefined, done: true}
