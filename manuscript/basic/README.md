-# Generators basics

Before discussing actual usage of generators, we start from the basic concept of generators.

There are two different concepts related to generators.

* **Generator function** - A special kind of function which generates generator objects.
* **Generator object** - An instance of generator function.

Execution of generator objects can be suspended and resumed. In JavaScript, we have only limited control over execution of normal functions. Given a function, when it starts execution, by using `()`, `apply` or `call`, it will run to the end of the execution.

For a simple function `sum` shown below, when it's invoked using `sum(1, 2)`, it starts execution and returns value `3` to the caller.

```js
function sum(a, b) {
    return a + b;
}

let result = sum(1, 2);
// -> 3
```

As JavaScript engine execution is single-threaded (not considering [web worker](https://en.wikipedia.org/wiki/Web_worker) here), during the execution of a function, there is no way to stop the execution. So if you accidentally create an infinite loop in your function, the whole application will be blocked.
