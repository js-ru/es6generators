// Spread operation in array literals
[1, ...values(), 2]
// -> [1, "a", "b", "c", 2]

// Spread operation in function calls
function join(x, y, z) {
  return x + y + z;
}
join(...values());
// -> "abc"
