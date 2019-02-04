# The Hidden Power of ES6 Generators: Observable Async Flow Control

*Перевод статьи Eric Elliott: [The Hidden Power of ES6 Generators: Observable Async Flow Control](https://medium.com/javascript-scene/the-hidden-power-of-es6-generators-observable-async-flow-control-cfa4c7f31435)*

*Дата публикации: 21.05.2016*

![Nautilus Shell — Dave Spindle (CC-BY-NC-2.0)](images/fibonacci.jpeg)

Generator functions are a new feature of JavaScript introduced in ES6. To explore them deeper, I decided to write a fibonacci generator function.

Here’s what I learned.

## Adopting New Features

Sometimes a new language feature comes along and I jump all over it and start using it all the time. That’s what happened with several other ES6 features. I made a list of my favorite ES6 features, and called it the ROAD MAP:

- **R** Rest & Spread
- **O** Object Literal Shortcuts (compact literals)
- **A** Arrow Functions
- **D** Destructuring & Default Parameters
- —
- **M** Modules
- **A** Asynchronous **P** Programming (promises & generators)

When I made the list, I thought these were the ES6 features I would use most. Initially, I was very excited about generators, but now that I’ve been living with them for a while, I haven’t found a lot of good use cases for generators in my real application code. For most use-cases I might use generators for, I reach for [RxJS](https://github.com/Reactive-Extensions/RxJS) instead because of it’s much richer API.

That doesn’t mean that generators don’t have lots of good use-cases. I tell myself I’ve been waiting for better JS engine support before I really go crazy with them, but it could be my mind simply isn’t thinking in terms of generators yet. The best way to fix that is to get more practice with them.

One of the use cases that immediately jumped into my mind when I heard about generators is that we might use them to grab values from any infinite series. That could have many applications, such as generative algorithms for graphics, computer game levels, music sequences, etc…

## What is the Fibonacci Sequence?

Fibonacci is a simple, canonical example that most of you are probably already familiar with. Here are the basics:

The fibonacci sequence is the series of numbers:

*0, 1, 1, 2, 3, 5, 8, 13, 21, 34…*

After the seed numbers, *0* and *1*, each successive number is the sum of the previous two numbers. One of the interesting properties of the sequence is that the ratio of the current number to the previous number in the sequence converges toward the golden ratio, *1.61803398875…*

You can use the Fibonacci sequence to generate all sorts of interesting things, like the Golden Spiral, which occurs in nature.

## What is a Generator Function?

Generator functions are a new feature in ES6 that allow a function to *generate many values over time* by returning an object which can be iterated over to pull values from the function one value at a time.

When the generator function is called, instead of directly returning a value, it returns an iterator object.

### The Iterator Protocol

The iterator object has a `.next()` method. When the `.next()` method is called, the function body resumes after the line that was executed the last time `.next()` was called. It continues execution until a `yield` is reached, at which point, it returns an object like this:

```js
{
  value: Any,
  done: Boolean
}
```

The `value` property contains the yielded value, and `done` indicates whether or not the generator has yielded its last value.

The iterator protocol is used by a lot of things in JavaScript, including the new `for…of` loop, the array rest/spread operator, and so on.

## 1. Generators Don’t Like Recursion

I’m in the habit of worrying about recursion in JavaScript. When a function calls another function, a new stack frame is allocated to store the state of the function’s data. Infinite recursion can lead to memory problems because there is a limit to how many stack frames can be allocated. When you hit those limits, it causes a stack overflow.

A stack overflow is like the cops raiding your party and telling all your friends to go home. Total buzz kill.

I was very excited when ES6 introduced tail call optimization, which lets a recursive function reuse the same stack frame for every iteration — but it only works when the recursive call is in the tail position. A call in tail position means that the function returns the result of the recursive call without any further computation.

Great! My first naive implementation uses a pretty straightforward twist on the canonical mathematical fibonacci definition:

![](images/fibonacci-1.png)

Using the seed values *0* and *1* to start the sequence, and moving the addition into the function call signature, it looks something like this:

```js
function* fib (n, current = 0, next = 1) {
  if (n === 0) {
    return 0;
  }

  yield current;
  yield* fib(n - 1, next, current + next);
}
```

I love how clean this looks. The seed values are obvious in the function signature and the formula is expressed quite clearly in the recursive call.

The `if` condition allows the loop to terminate by using `return` instead of `yield` when `n` reaches 0. If you don’t pass `n`, it will be `undefined` and evaluate to `NaN` when we try to subtract `1` from it, so the function will never terminate.

This implementation is very straightforward… and naive. When I tested in on large values, it exploded.

(ಥ﹏ಥ)

Sadly, **tail call optimization does not apply to generators**. In the specification under function call [Runtime Semantics: Evaluation](https://tc39.github.io/ecma262/#sec-function-calls):

7. Let `tailCall` be `IsInTailPosition(thisCall)`.

8. Return `EvaluateDirectCall(func, thisValue, Arguments, tailCall)`.

**IsInTailPosition** returns false for generators (see [14.6.1](https://tc39.github.io/ecma262/#sec-tail-position-calls)):

5. If `body` is the `FunctionBody` of a `GeneratorBody`, return `false`.

In other words, **avoid recursion for infinite generators**. You need to use the iterative form instead if you want to avoid stack overflows.

> **Edit:** For several months I was enjoying tail call optimization in Babel, but it has since been removed. As far as I know at the time of this writing, [only Webkit (Safari, Mobile Safari) supports the new ES6 proper tail calls, due to controversy/difficulty](https://kangax.github.io/compat-table/es6/) raised by engine implementers.

With a little modification, we can remove the recursion and use an iterative form instead:

```js
function* fib (n) {
  const isInfinite = n === undefined;
  let current = 0;
  let next = 1;

  while (isInfinite || n--) {
    yield current;
    [current, next] = [next, current + next];
  }
}
```

As you can see, we’re still doing the same variable swap that was in the original function call signature, but this time we’re using destructuring assignment to accomplish it inside a while loop. We need `isInfinite` in the generator in case we don’t pass a limit.

## 2. Let the Parameters Limit Iterations

It’s possible to extract an array from your generator using a combination of destructuring assignment and the …rest syntax:

```js
const [...arr] = generator(8);
```

But if your generator is an infinite series and there’s no way to describe a limit by passing a parameter, the resulting array will never stop filling.

In both of the Fibonacci implementations above, we allow the caller to pass `n`, which limits the sequence to the first `n` numbers. All good!

┬─┬ ノ( ゜-゜ノ)

## 3. Be Careful with Memoized Functions

It’s very tempting to memoize something like the Fibonacci sequence, because doing so can dramatically decrease the number of required iterations. In other words, it makes it **a lot faster**.

### What’s a Memoized Function?

For functions which always produce the same output given the same arguments, you can record the results in a memo for future calls so that the work of calculating the results doesn’t have to be repeated. Instead, the result is looked up in the memo and returned without repeating the calculation. The Fibonacci algorithm repeats lots of calculations to come up with results, which means that if we memoize the function, we can save a lot of time.

Let’s look at how we can memoize the iterative form of the Fibonacci generator:

```js
const memo = [];

const fib = (n) => {
  if (memo[n] !== undefined) return memo[n];

  let current = 0;
  let next = 1;

  for (let i = 0; i < n; i++) {
    memo[i] = current;
    [current, next] = [next, current + next];
  }

  return current;
};

function* gen (n = 79) {
  fib(n);
  yield* memo.slice(0, n + 1);
}

export default gen;
```

Because `n` essentially represents an index into an array of numbers, we can use it as a literal array index. Subsequent calls will just look up that index and return the corresponding result value.

### Edit:

The original version of this code contained a bug. The first time you would run the function, everything would work just fine, but the memo was written incorrectly because you can’t just yield a value when you find a memo hit — unlike `return`, `yield` does not stop the rest of the function from running. It simply pauses execution until `.next()` gets called again.

This has been the hardest point for me to wrap my head around. `yield` is not just `return` for generators. You also have to think carefully about how resuming the function with `next()` impacts the way you write the logic.

In this case, I was able to get the logic working using `yield`, but it made the control flow hard to read.

It occurred to me that for something that can be memoized this way, it’s much easier for me to read when I separate the generator function from the calculation logic.

As you can see, the new generator function is extremely simple — it simply calculates the memo array by calling the memoized `fib()`, and then delegates the generator to the resulting array iterable using `yield*`.

`yield*` is a special form of `yield` that will delegate to another generator or iterable. For example:

```js
const a = [1, 2, 3];
const b = [4, 5, 6];

function* c () {
  yield 7;
  yield 8;
  yield 9;
}

function* gen () {
  yield* a;
  yield* b;
  yield* c();
  yield 10;
}

const [...sequence] = gen();
console.log(sequence); // [1,2,3,4,5,6,7,8,9,10]
```

### Benchmarks

Whenever I’m playing with competing algorithm implementations, I usually write a simple benchmark script to compare the performance.

For this test, I generated 79 numbers, each. I used Node’s `process.hrtime()` to record nanosecond-accurate timings for both implementations, ran the test three times, and averaged the results:

![](images/fibonacci-2.png)

As you can see, that’s quite a significant difference. If you’re generating a lot of numbers and you want it to be fast, the memoized solution is clearly a wise choice.

There’s just one problem: With an infinite series, the memo array will have unbounded growth. Eventually, you’re going to run into heap size limits, and that will crash the JS engine.

No worries though. With Fibonacci, you’ll run into the maximum exact JavaScript integer size first, which is *9007199254740991*. That’s over **9 quadrillion**, which is a big number, but Fibonacci isn’t impressed. Fibonacci grows _**fast**_. You’ll burst that barrier after generating only 79 numbers.

## 4. JavaScript Needs a Builtin API for Precise Timing

Every time I write a simple benchmark script, I wish for a precision timing API that works in both browsers and Node, but there isn’t one. The closest we can get is a library that provides a facade that wraps both the browser’s `performance.now()` API and Node’s `process.hrtime()` API to present a unified API. Realistically, though, Node-only benchmarks are enough for this test.

My only complaint is that Node’s `process.hrtime()` returns an array instead of a straightforward value in nanoseconds. This is easily remedied, though:

```js
const nsTime = (hrtime) => hrtime[0] * 1e9 + hrtime[1];
```

Just pass the array returned from `process.hrtime()` to this function and you’ll get human-friendly nanoseconds back. Let’s take a look at the benchmark script I used to compare the iterative Fibonacci generator to the memoized version:

```js
import iterativefib from 'iterativefib';
import memofib from 'memofib';
import range from 'test/helpers/range';

const nsTime = (hrtime) => hrtime[0] * 1e9 + hrtime[1];

const profile = () => {
  const numbers = 79;
  const msg = `Profile with ${ numbers } numbers`;

  const fibGen = iterativefib();
  const fibStart = process.hrtime();
  range(1, numbers).map(() => fibGen.next().value);
  const fibDiff = process.hrtime(fibStart);

  const memoGen = memofib();
  const memoStart = process.hrtime();
  range(1, numbers).map(() => memoGen.next().value);
  const memoDiff = process.hrtime(memoStart);

  const original = nsTime(fibDiff);
  const memoized = nsTime(memoDiff);

  console.log(msg);
  console.log(`
    original: ${ original }ns
    memoized: ${ memoized }ns
  `);
};

profile();
```

My favorite feature of `hrtime()` is that you can pass the start time into the function to get the time elapsed since the start time — exactly what you need for profiling.

Sometimes, processes can encounter some terrible luck with the OS task scheduler, so I like to run scripts like this multiple times and average the results.

I’m certain you could come up with much more accurate ways to benchmark your code, but something like this should be good enough for most situations — especially when there is such a clear winner like the memoized Fibonacci implementation.

## 5. Beware of Floating Point Precision Errors

I don’t want to bore you with too much crazy math, but did you know that there’s a very efficient way to calculate Fibonacci without iterations or recursion? It looks like this:

```js
const sqrt = Math.sqrt;
const pow = Math.pow;

const fibCalc = n => Math.round(
  (1 / sqrt(5)) *
  (
    pow(((1 + sqrt(5)) / 2), n) -
    pow(((1 - sqrt(5)) / 2), n)
  )
);
```

The only problem is the limitation of floating point precision. The actual formula does not include any rounding. I added it because floating point errors start to cause the results to drift after `n = 11`. Not very impressive.

The good news is that by adding rounding, we can increase the accuracy to `n = 75`. Much better. That’s just a few numbers shy of the maximum precise value using JavaScript’s native `Number` type, which we discovered earlier is `n = 79`.

So, as long as we don’t need values higher than `n = 75`, this faster formula will work great! Let’s turn it into a generator:

```js
const sqrt = Math.sqrt;
const pow = Math.pow;

const fibCalc = n => Math.round(
  (1 / sqrt(5)) *
  (
    pow(((1 + sqrt(5)) / 2), n) -
    pow(((1 - sqrt(5)) / 2), n)
  )
);

function* fib (n) {
  const isInfinite = n === undefined;
  let current = 0;

  while (isInfinite || n--) {
    yield fibCalc(current);
    current++;
  }
}
```

Looks good. Let’s look at a benchmark run:

```
Profile with 79 numbers
    original: 901643ns
    memoized: 544423ns
    formula:  311068ns
```

Faster, yes, but we’ve lost our last few accurate numbers. Worth the tradeoff?

¯\(º_o)/¯

## 6. Know Your Limits

Before I started:

- I had no idea how many accurate values I could produce in this series using the standard JavaScript `Number` type.
- I had no idea how many accurate values I could produce with the formula version.
- I had no idea how many recursive calls I’d make to produce those accurate values.

But now that I know all these limits, the best implementation so far is one I haven’t shown you, yet:

```js
const lookup = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393,
196418, 317811, 514229, 832040, 1346269, 2178309, 3524578, 5702887, 9227465,
14930352, 24157817, 39088169, 63245986, 102334155, 165580141, 267914296,
433494437, 701408733, 1134903170, 1836311903, 2971215073, 4807526976,
7778742049, 12586269025, 20365011074, 32951280099, 53316291173, 86267571272,
139583862445, 225851433717, 365435296162, 591286729879, 956722026041,
1548008755920, 2504730781961, 4052739537881, 6557470319842, 10610209857723,
17167680177565, 27777890035288, 44945570212853, 72723460248141,
117669030460994, 190392490709135, 308061521170129, 498454011879264,
806515533049393, 1304969544928657, 2111485077978050, 3416454622906707,
5527939700884757, 8944394323791464];

function* fib (n = 79) {
  if (n > 79) throw new Error('Values are not available for n > 79.');
  yield* lookup.slice(0, n);
}
```

Most of the times I’ve used an infinite series in a real application, I actually needed a limited number of values for a specific purpose (usually generating graphics). Most of the time it was faster to grab values from a **lookup table** than it would have been to compute the values. In fact, this was a frequent optimization used in computer games in the 80’s and 90’s. It probably still is.

Since arrays are iterables in ES6 and already behave like generators by default, we can simply delegate to the lookup table using `yield*`.

Not surprisingly, this is the fastest implementation of the bunch, by a large margin:

```
Profile with 79 numbers
    original: 890088ns
    memoized: 366415ns
    formula:  309792ns
    lookup:   191683ns
```

Looking back, I’m pretty sure that as long as we limited the series to accurate values, the callstack would be no problem… a slightly modified recursive version would probably do just fine:

```js
const memo = [0, 1];

const fib = (n) =>
  memo[n] !== undefined ? memo[n] :
  memo[n] = fib(n - 1) + fib(n - 2);

function* gen (n = 79) {
  if (n > 79) throw new Error('Accurate values are not available for n > 79.');
  fib(n);
  yield* memo.slice(0, n);
}

export default gen;
```

This one is my favorite of the bunch. The seed values can go in the memo, leaving the actual calculation about as close as you can get to the mathematical recurrence relation: _Fn = Fn-1 + Fn-2_

For the generator we’re just delegating to the memo array again.

### Limits to Watch

- If you use a formula that utilizes floating point math, you should definitely test the limits of its accuracy.
- If you’re using a series that grows exponentially, you should figure out how much of the series you can produce before you run into the limitations of the JS `Number` type.
- If your limits are small enough, consider pre-generating a lookup table to speed up your production app.

If you decide you need larger accurate numbers than JavaScript can represent natively, you’re not entirely out of luck. There are arbitrary size integer libraries available, such as [BigInteger](https://github.com/peterolson/BigInteger.js).

## 7. Lots of Things Act Like Generators

When the generator functions were introduced in ES6, a lot of other builtin things also implemented the **iterator protocol** (the thing that gets returned from the generator that can be iterated over).

More precisely, they implemented the **iterable protocol**. `String`, `Array`, `TypedArray`, `Map` and `Set` are all builtin iterables, which means they all have a `[Symbol.iterator]` property that is not enumerable.

In other words, you can now iterate over any array-like builtin object using the iterator `.next()` method.

Here’s how you can access an array iterator. The technique is the same for anything that implements the iterable protocol:

```js
let arr = [1,2,3];
let foo = arr[Symbol.iterator]();

arr.forEach(() => console.log( foo.next() ));
console.log(foo.next());
// { value: 1, done: false }
// { value: 2, done: false }
// { value: 3, done: false }
// { value: undefined, done: true }
```

You can even build your own custom iterables:

```js
const countToThree = {
  a: 1,
  b: 2,
  c: 3
};

countToThree[Symbol.iterator] = function* () {
  const keys = Object.keys(this);
  const length = keys.length;

  for (const key in this) {
    yield this[key];
  }
};

let [...three] = countToThree;
console.log(three); // [ 1, 2, 3 ]
```

And even redefine builtin iterable behaviors, but beware — I’m seeing inconsistent behavior between Babel and V8:

```js
const abc = [1,2,3];

abc[Symbol.iterator] = function* () {
  yield 'a';
  yield 'b';
  yield 'c';
};

let [...output] = abc;
console.log(output);
abc.forEach(c => console.log(c));

// babel logs:
/*
[1,2,3]
1
2
3
*/

// Node logs:
/*
[ 'a', 'b', 'c' ]
1
2
3
*/
```

I thought it might be convenient to write a function that’s basically a shortcut for `arr[Symbol.iterator]()`, so I made one and gave it a fun slicing API so you can easily grab chunks of an array and turn them into iterators. I called it arraygen. You can [browse arraygen on GitHub](https://github.com/ericelliott/arraygen).

## Conclusion

Hopefully I hit on some stuff you might not have known about generators. I went off on a couple interesting tangents, too:

- **Avoid recursion.** Generators don’t get optimized tail calls.
- **Allow parameters to limit the length of your generators**, and you can use the …rest operator to destructure them.
- **Memoized infinite generators can blow the heap size limits.**
- **JavaScript has two competing APIs for precise timings.** Why can’t we all work together? (ಥ﹏ಥ)
- **Floating point precision errors can trip up formula-based infinite generators.** Be careful.
- **Know your limits.** Does your generator have enough runway to satisfy the needs of your application? Is it accurate enough over the span of that runway? Are you going to run into limitations of the data type you’re using? Will the JS engine have enough memory to keep your generator running as long as you want it to?
- **Most of the builtins behave a bit like generators** with the iterable protocol, and you can define your own custom iterables.

If you want to play with the Fibonacci examples, you can[ clone the full source from GitHub](https://github.com/learn-javascript-courses/fibonacci).

