function *seq(start = 0, number = 10) {
  while (number-- > 0) {
    yield start++;
  }
}

debug(seq());
// -> Output values from 0 to 9

debug(seq(3));
// -> Output values from 3 to 12

debug(seq(3, 5));
// -> Output values from 3 to 7
