let set = new Set(values());
set.size;
// -> 3

set.forEach(function(value) {
  console.log(value);
});
// -> Output 1, 2, 3
