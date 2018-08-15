# Что такое генераторы в JavaScript и как их использовать?

*Перевод статьи Vladislav Stepanov: [What are JavaScript Generators and how to use them](https://codeburst.io/understanding-generators-in-es6-javascript-with-examples-6728834016d5)*

*Дата публикации: 02.03.2018*

![](images/what-are-javascript-generators-and-how-to-use-them-1.jpeg)

In this article, we’re going to take a look at the generators that were introduced in ECMAScript 6. We’ll see what it is and then look at some examples of their use.

## What are JavaScript Generators?

Generators are functions that you can use to control the iterator. They can be suspended and later resumed at any time.

If that doesn’t make sense, then let’s look at some examples that will explain what generators are, and what’s the difference between a generator and an iterator like for-loop.

This is a for-loop loop that returns a heap of values immediately. What does this code do? — simply repeats numbers from 0 to 5.

```js
for (let i = 0; i < 5; i += 1) {
  console.log(i);
}
// this will return immediately 0 -> 1 -> 2 -> 3 -> 4
```

Now let’s look at the generator function.

```js
function * generatorForLoop(num) {
  for (let i = 0; i < num; i += 1) {
    yield console.log(i);
  }
}

const genForLoop = generatorForLoop(5);

genForLoop.next(); // first console.log - 0
genForLoop.next(); // 1
genForLoop.next(); // 2
genForLoop.next(); // 3
genForLoop.next(); // 4
```

What does it do? In fact, it just wraps our for-loop from the example above with some changes. But the most significant change is that it does not ring immediately. And this is the most important feature in generators — we can get the next value in only when we really need it, not all the values at once. And in some situations it can be very convenient.

## The syntax generators

How can we declare the generator function? There is a list of possible ways to do this, but the main thing is to add an asterisk after the function keyword.

```js
function * generator () {}
function* generator () {}
function *generator () {}

let generator = function * () {}
let generator = function* () {}
let generator = function *() {}

let generator = *() => {} // SyntaxError
let generator = ()* => {} // SyntaxError
let generator = (*) => {} // SyntaxError
```

As you can see from the example above, we cannot create a generator using the arrow function.

Next-the generator as a method. It is declared in the same way as functions.

```js
class MyClass {
  *generator() {}
  * generator() {}
}

const obj = {
  *generator() {}
  * generator() {}
}
```

## Yield

Now let’s take a look at the new keyword yield. It’s a bit like return, but not. Return simply returns the value after the function call, and it will not allow you to do anything else after the return statement.

```js
function withReturn(a) {
  let b = 5;
  return a + b;
  b = 6; // we will never re-assign b
  return a * b; // and will never return new value
}

withReturn(6); // 11
withReturn(6); // 11
```

*Yield* works different.

```js
function * withYield(a) {
  let b = 5;
  yield a + b;
  b = 6; // it will be re-assigned after first execution
  yield a * b;
}

const calcSix = withYield(6);

calcSix.next().value; // 11
calcSix.next().value; // 36
```

*Yield* returns a value only once, and the next time you call the same function it will move on to the next *yield* statement.

Also in generators we always get the object as output. It always has two properties *value* and *done*. And as you can expect, *value* - returned value, and *done* shows us whether the generator has finished its job or not.

```js
function * generator() {
  yield 5;
}

const gen = generator();

gen.next(); // {value: 5, done: false}
gen.next(); // {value: undefined, done: true}
gen.next(); // {value: undefined, done: true} - all other calls will produce the same result
```

Not only can *yield* be used in generators, *return* will also return the same object to you, but after you reach the first *return* statement the generator will finish it’s job.


```js
function * generator() {
  yield 1;
  return 2;
  yield 3; // we will never reach this yield
}

const gen = generator();

gen.next(); // {value: 1, done: false}
gen.next(); // {value: 2, done: true}
gen.next(); // {value: undefined, done: true}
```

## Yield delegator

*Yield* with asterisk can delegate it’s work to another generator. This way you can chain as many generators as you want.

```js
function * anotherGenerator(i) {
  yield i + 1;
  yield i + 2;
  yield i + 3;
}

function * generator(i) {
  yield* anotherGenerator(i);
}

var gen = generator(1);

gen.next().value; // 2
gen.next().value; // 3
gen.next().value; // 4
```

Before we move on to methods, let’s take a look at some behavior that may seem rather strange the first time.

This is normal code without any errors, which shows us that *yield* can return passed value in the call method *next()*.

```js
function * generator(arr) {
  for (const i in arr) {
    yield i;
    yield yield;
    yield(yield);
  }
}

const gen = generator([0,1]);

gen.next(); // {value: "0", done: false}
gen.next('A'); // {value: undefined, done: false}
gen.next('A'); // {value: "A", done: false}
gen.next('A'); // {value: undefined, done: false}
gen.next('A'); // {value: "A", done: false}
gen.next(); // {value: "1", done: false}
gen.next('B'); // {value: undefined, done: false}
gen.next('B'); // {value: "B", done: false}
gen.next('B'); // {value: undefined, done: false}
gen.next('B'); // {value: "B", done: false}
gen.next(); // {value: undefined, done: true}
```

As you can see in this example *yield* by default is *undefined* but if we will pass any value and just calls *yield* it will return us our passed value. We will use this feature soon.

## Methods and initialization

Generators are reusable, but to be so — you need to initialize them, fortunately it is quite simple.

```js
function * generator(arg = 'Nothing') {
  yield arg;
}

const gen0 = generator(); // OK
const gen1 = generator('Hello'); // OK
const gen2 = new generator(); // Not OK

generator().next(); // It will work, but every time from the beginning
```

So *gen0* and *gen1* are won’t affect each other. And *gen2* won’t work at all, even more you will get an error. Initialization is important to keep the state of progress.

Now let’s look at the methods that generators give us.

**Method next():**

```js
function * generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator();

gen.next(); // {value: 1, done: false}
gen.next(); // {value: 2, done: false}
gen.next(); // {value: 3, done: false}
gen.next(); // {value: undefined, done: true} and all next calls will return the same output
```

This is the main method that you will use most often. It gives us the next output object every time we call it. And when it is done, *next()* set the *done* property to *true* and value to *undefined*.

Not only *next()* we can use to iterate generator. But using *for-of loop* we get all the values (not the object) of our generator.

```js
function * generator(arr) {
  for (const el in arr)
    yield el;
}

const gen = generator([0, 1, 2]);

for (const g of gen) {
  console.log(g); // 0 -> 1 -> 2
}

gen.next(); // {value: undefined, done: true}
```

This will not work with for-in loop and you can’t get access to properties by just typing number — *generator[0]* = undefined.

**Method return():**

```js
function * generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator();

gen.return(); // {value: undefined, done: true}
gen.return('Heeyyaa'); // {value: "Heeyyaa", done: true}

gen.next(); // {value: undefined, done: true} - all next() calls after return() will return the same output
```

*Return()* will ignore any code in the generator function that you have. But will set the value based on a passed argument and set done to be true. Any calls *next()* after *return()* will return done-object.

**Method throw():**

```js
function * generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator();

gen.throw('Something bad'); // Error Uncaught Something bad
gen.next(); // {value: undefined, done: true}
```

It’s easy one all is *throw()* do — just throws the error. We can handle it using *try — catch*.

## Implementation of custom methods

We can’t directly access the *Generator* constructor, so we need to figure out how to add new methods. That’s what I do, but you can choose a different path.

```js
function * generator() {
  yield 1;
}

generator.prototype.__proto__; // Generator {constructor: GeneratorFunction, next: ƒ, return: ƒ, throw: ƒ, Symbol(Symbol.toStringTag): "Generator"}

// as Generator is not global variable we have to write something like this
generator.prototype.__proto__.math = function(e = 0) {
  return e * Math.PI;
}

generator.prototype.__proto__; // Generator {math: ƒ, constructor: GeneratorFunction, next: ƒ, return: ƒ, throw: ƒ, …}

const gen = generator();
gen.math(1); // 3.141592653589793
```

## The use of generators!

Previously, we used generators with a known number of iterations. But what if we don’t know how many iterations are needed. To solve this problem, it is enough to create an infinite loop in the function generator. The example below demonstrates this for a function that returns a random number.

```js
function * randomFrom(...arr) {
  while (true)
    yield arr[Math.floor(Math.random() * arr.length)];
}

const getRandom = randomFrom(1, 2, 5, 9, 4);

getRandom.next().value; // returns random value
```

It was easy, as for the more complex functions, for example, we can write a function of the throttle. If you don’t know what it is, there’s a great article about it.

```js
function * throttle(func, time) {
  let timerID = null;
  function throttled(arg) {
    clearTimeout(timerID);
    timerID = setTimeout(func.bind(window, arg), time);
  }
  while (true)
    throttled(yield);
}

const thr = throttle(console.log, 1000);

thr.next(); // {value: undefined, done: false}
thr.next('hello'); // {value: undefined, done: false} + 1s after -> 'hello'
```

But what about something more useful in terms of using generators? If you’ve ever heard of recursions I’m sure you’ve also heard of [Fibonacci numbers](https://en.wikipedia.org/wiki/Fibonacci_number). Usually it is solved with recursion, but with the help of a generator we can write it this way:

```js

function * fibonacci(seed1, seed2) {
  while (true) {
    yield (() => {
      seed2 = seed2 + seed1;
      seed1 = seed2 - seed1;
      return seed2;
    })();
  }
}

const fib = fibonacci(0, 1);
fib.next(); // {value: 1, done: false}
fib.next(); // {value: 2, done: false}
fib.next(); // {value: 3, done: false}
fib.next(); // {value: 5, done: false}
fib.next(); // {value: 8, done: false}
```

There is no need of recursion more! And we can get the next number, when we really need them.

## The use of generators with HTML

Since we are talking about JavaScript the most obvious way to use the generator is to perform some actions with HTML.

So, suppose we have some number of HTML blocks that we want to go through, we can easily achieve this with a generator, but keep in mind that there are many more possible ways to do this without generators.

[See pen](https://codepen.io/vldvel/pen/LQqegv)

This is done with a small amount of code.

```js
const strings = document.querySelectorAll('.string');
const btn = document.querySelector('#btn');
const className = 'darker';

function * addClassToEach(elements, className) {
  for (const el of Array.from(elements))
    yield el.classList.add(className);
}

const addClassToStrings = addClassToEach(strings, className);

btn.addEventListener('click', (el) => {
  if (addClassToStrings.next().done)
    el.target.classList.add(className);
});
```

In fact, only five lines of logic.

## That’s it!

There are many more possible ways to use generators. For example, they can be useful when working with asynchronous operations. Or iterate through an on-demand item loop.

I hope this article has helped you better understand JavaScript generators.