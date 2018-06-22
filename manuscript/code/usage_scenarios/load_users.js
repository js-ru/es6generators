function *loadUsers() {
  yield 'annoymous';
  yield* loadFromFile();
  yield* loadFromDb();
}
