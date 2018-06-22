'use strict';

import Promise from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));

async function readFile(path) {
  let content = await fs.readFileAsync(path, 'utf8');
  console.log(content);
}

readFile('sample.txt');
