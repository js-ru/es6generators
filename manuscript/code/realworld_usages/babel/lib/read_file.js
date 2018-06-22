'use strict';

let readFile = (() => {
  var _ref = _asyncToGenerator(function* (path) {
    let content = yield fs.readFileAsync(path, 'utf8');
    console.log(content);
  });

  return function readFile(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const fs = _bluebird2.default.promisifyAll(require('fs'));

readFile('sample.txt');