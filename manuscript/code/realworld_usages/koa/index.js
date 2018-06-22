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
