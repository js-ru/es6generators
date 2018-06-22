function *loop() {
  var count = 0;
  while (true) {
    let shouldExit = yield count++;
    if (shouldExit) {
      return count++;
    }
  }
}
