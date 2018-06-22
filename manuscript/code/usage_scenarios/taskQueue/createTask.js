module.exports = function createTask(value, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value < 5) {
        console.log('value => ' + value);
        resolve(value);
      } else {
        reject(new Error('value to large!'));
      }
    }, timeout);
  });
}
