## Koa basics

Koa is very easy to configure and use. Each application creates different middleware to handle requests and generate responses. Each middleware is a generator function and registered using `use()` of Koa application. Middleware are processed in a chain with the same order as they are registered. Each middleware can access context information using `this`, e.g. `request`, `response`, `method` and `url`.

The code below is a simple Koa application. It registers two middleware generator functions, the first one is used to log request processing time and the second one is used to set the response body to `Hello World`.

```js
var koa = require('koa');
var app = koa();

app.use(function *log(next){
  console.log('LOG - capture start date');
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('LOG - %s %s => %s', this.method, this.url, ms);
});

app.use(function *setBody(){
  console.log('set body');
  this.body = 'Hello World';
});

app.listen(3000);
```

Each middleware generator function can take an extra argument which represents the next middleware in the chain. If a middleware generator function needs to intercept execution of downstream middleware in the chain, it can perform certain tasks first, then call `yield` to delegate to other middleware, then perform other tasks after downstream middleware finish. The logging middleware generator function in the code above demonstrates this pattern. It records start time when a request comes in, then it calls `yield next` for delegation, finally it records the finish time and calculates the duration.

After accessing the `http://localhost:3000`, the console log looks like below:

```plaintext
LOG - capture start date
set body
LOG - GET / => 5
```

I> If you know about [AOP](https://en.wikipedia.org/wiki/Aspect-oriented_programming), then middleware with `yield` expression is similar with [around advice](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/aop.html#aop-ataspectj-around-advice).
