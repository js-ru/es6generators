## `koa-compose`

[`koa-compose`](https://github.com/koajs/compose) is the small library which does the composition of middleware generator functions. Its [source code](https://github.com/koajs/compose/blob/master/index.js) is very simple, only 29 sloc. `compose` is the main method to compose middleware. The argument `middleware` is an array of middleware generator functions in the order of registration. The return value of `compose` method is a generator function with argument `next`. `next` is an optional generator function which is the last middleware in the chain.

```js
function compose(middleware){
  return function *(next){
    if (!next) next = noop();

    var i = middleware.length;

    while (i--) {
      next = middleware[i].call(this, next);
    }

    return yield *next;
  }
}

function *noop(){}
```

Let's go through the generator function code line by line. The first line `if (!next) next = noop();` sets `next` to a do-nothing generator function `noop` if it's `null`. `i` is the loop variable for array `middleware` starting from the last middleware in the array. In the `while` loop, the generator function of each middleware is invoked with the current value of `next` as the argument, the returned generator object is set as the new value of `next`. Then `yield*` is used to delegate to final `next` generator object.

We'll see how middleware are used in the sample application of [Koa basics](./koa_basics.md). The `middleware` array contains two generator functions, `log` and `setBody`. In the `while` loop, generator function `setBody` is invoked first with the argument `next` set to `noop` and `next` is set to the generator object of `setBody`. Then generator function `log` is invoked with the argument `next` set to the generator object of `setBody` and `next` is set to the generator object of `log`. The last `yield* next` expression delegates to the generator object of `log`.

The returned generator function of `compose` is turned into a regular function that returns a `Promise` using `co.wrap` from [co](#co). The wrapped function is the actual request handler. When a request comes in, the generator object of `log` starts execution first and runs until the `yield next`, so the start time is recorded. `next` is a generator object of `setBody`, invoking `yield next` triggers the execution of `setBody` and set the response body. Finally, the generator object of `log` resumes execution and calculate the duration.
