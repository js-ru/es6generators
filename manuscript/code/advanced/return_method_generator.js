let func = values();
func.next();
// -> {value: "a", done: false}
func.return('d');
// -> {value: "d", done: true}
func.next();
// -> {value: undefined, done: true}
