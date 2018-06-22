let func = values();
func.next();
// -> {value: "a", done: false}
func.next();
// -> {value: "b", done: false}
func.next();
// -> {value: "c", done: false}
func.next();
// -> {value: undefined, done: true}
func.return('d');
// -> {value: "d", done: true}
func.return('e');
// -> {value: "e", done: true}
