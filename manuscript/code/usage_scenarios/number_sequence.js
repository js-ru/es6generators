function *numbers() {
  for (let i = 0; i < 20; i++) {
    if (i < 5) {
      yield i;
    } else if (i < 10 && i % 2 === 0) {
      yield i * 2;
    } else if (i < 15 && i % 3 === 0) {
      yield i * 3;
    } else if (i % 7 === 0) {
      yield i * 7;
    }
  }
}

debug(numbers());
// -> Output numbers: 0, 1, 2, 3, 4, 12, 49, 16, 27, 36, 98
