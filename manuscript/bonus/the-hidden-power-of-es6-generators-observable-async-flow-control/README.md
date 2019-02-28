# Скрытая сила генераторов ES6: Управление асинхронным потоком через Observable

*Перевод статьи Eric Elliott: [The Hidden Power of ES6 Generators: Observable Async Flow Control](https://medium.com/javascript-scene/the-hidden-power-of-es6-generators-observable-async-flow-control-cfa4c7f31435)*

*Дата публикации: 21.05.2016*

![Турбинный зал Волжской ГЭС — Kent Kanouse (CC BY-NC 2.0)](images/turbine.jpeg)

В статье «[7 выводов, которые я сделал, когда писал генератор последовательности Фибоначчи на JavaScript]()», я рассмотрел один очевидный случай использования генератора ES6: создание повторяющихся последовательностей значений по одному за раз. Если вы еще не читали, советую ознакомиться. Итерирование — основа многих функций в ES6+, поэтому важно понять, как оно работает.

В той статье я намеренно не рассказал об еще одном распространенном случае использования генераторов: управление асинхронным потоком.

### Async / Await

Возможно вы слышали о стандартных Async / Await в JavaScript.

Их нет в ES6 и не будет в ES2016. Они могут стать стандартными инструментами в ES2017: нужно будет дождаться их полной реализации в JS-движке, и мы сможем их использовать. _(Примечание: теперь Async / Await работает в Babel, но никаких гарантий нет. Оптимизация вызовов в Babel работала несколько месяцев, но впоследствии была удалена)._

Несмотря на ожидание, есть куча статей об async / await. Почему?

Async / await может превратить такой код: 


```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const promiseFunc = () => new Promise((resolve) => {
  fetchSomething().then(result => {
    resolve(result + ' 2');
  });
});

promiseFunc().then(res => console.log(res));
```

В такой:


```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

async function asyncFunction() {
  const result = await fetchSomething(); // возвращает промис

  // ждём выполнение промиса и используем его результат
  return result + ' 2';
}

asyncFunction().then(result => console.log(result));
```

Обратите внимание, что в первом примере функция, основанная на промисах, имеет дополнительный уровень вложенности. Версия async / await выглядит как обычный синхронный код, но это не так. Здесь показан промис и выход из функции, который освобождает JS-движок для других задач. После промиса `fetchSomething()` функция возобновляется, а полученному промису присваивается значение `result`.

Это асинхронный код, который _выглядит и ведет себя как синхронный_. Для программистов на JavaScript, которые ежедневно сталкиваются с асинхронным программированием, это священный Грааль: все преимущества производительности асинхронного кода без каких-либо когнитивных издержек.

Я хотел бы подробнее рассмотреть, как async / await используются в генераторах. Также рассмотрим, как управлять потоком синхронно уже сейчас, _не дожидаясь реализации async / await_.

### Генераторы

Генераторы — это новая возможность в ES6, которая позволяет функции генерировать множество значений в произвольный момент времени и возвращать итерируемый объект методом `.next()`:

```js
{
  value: Any,
  done: Boolean
}
```

Свойство `done` указывает, вернул ли генератор последнее значение.

Протокол итератора используется в JavaScript повсеместно: в новом цикле `for … of`, операторах массива rest/spread и т. д.


```js
function* foo() {
  yield 'a';
  yield 'b';
  yield 'c';
}

for (const val of foo()) {
  console.log(val);
}
// a
// b
// c

const [...values] = foo();
console.log(values); // ['a','b','c']
```

### Вернемся к генераторам

Здесь все становится еще интересней. Взаимодействие с генераторами может происходить в обоих направлениях. Можно не только получить значения от генераторов, но и ввести в них значения. Метод iterator `.next()` может принимать значения, которые необходимо присвоить.

```js
function* crossBridge() {
  const reply = yield 'What is your favorite color?';
  console.log(reply);
  if (reply !== 'yellow') return 'Wrong!'
  return 'You may pass.';
}

{
  const iter = crossBridge();
  const q = iter.next().value; // Iterator yields question
  console.log(q);
  const a = iter.next('blue').value; // Pass reply back into generator
  console.log(a);
}

// What is your favorite color?
// blue
// Wrong!


{
  const iter = crossBridge();
  const q = iter.next().value;
  console.log(q);
  const a = iter.next('yellow').value;
  console.log(a);
}

// What is your favorite color?
// yellow
// You may pass.
```

Есть еще несколько способов взаимодействия с генераторами. Вы можете перебирать ошибки в них с помощью throw: например, вы можете вызвать `iter.throw(error)`, чтобы сообщить, что что-то пошло не так при получении данные из генератора. Также генератор может вернуть код с помощью `iter.return()`.

Обе команды могут пригодиться, чтобы добавить обработку ошибок в код управления потоком.

### Генераторы + Промисы = Святой Грааль

Представим, что есть функция, которая возвращает генератор, который обнаруживает промисы, ждет их результата, а затем полученное значение возвращает обратно в генератор с последующим вызовом `.next()`.

Затем можно добавить async / await, как в этом примере:

```js
const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const asyncFunc = gensync(function* () {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
});

// Call the async function and pass params.
asyncFunc('param1', 'param2', 'param3')
  .then(val => console.log(val));
```

Оказывается, такая библиотека уже существует. Она называется **[Co.js](https://github.com/tj/co)**. Я не буду учить вас использовать Co: давайте попробуем выяснить, как самому можно написать что-то подобное. Судя по примеру с `crossBridge()` выше, это должно быть довольно легко.

Начнем с простой функции `isPromise()`:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';
```

Затем нам понадобится способ повторить вызов генератора `.next()`, выполнить промисы и дождаться их результатов до следующего вызова `.next()`. Это довольно простой подход без обработки ошибок. Это всего лишь идея. Если вы не хотите использовать такой способ на практике, это приведет к ошибкам и проблемам с отладкой:

```js
const next = (iter, callback, prev = undefined) => {
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};
```

Как вы можете видеть, мы передаем обратный вызов, чтобы вернуть окончательное значение. Мы связываемся с генератором, передавая предыдущее значение через `.next()` в верхней части функции. Это позволяет нам получить результат предыдущего вызова `yield` для идентификатора:

```js
const next = (iter, callback, prev = undefined) => {
  // 2. The yielded value is extracted by calling
  // .next(). We pass the previous value back into
  // the generator for assignment.
  const item = iter.next(prev);
  const value = item.value;

  // 4. The final value gets passed to the callback.
  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};

const asyncFunc = gensync(function* () {
  // 1. yield value gets passed to the iterator.
  // The function exits at the yield call time,
  // and the `result` assignment doesn't happen
  // until the generator is resumed.
  const result = yield fetchSomething();

  // 3. Does not run until .next() is called again.
  // `result` will contain the value passed into
  // the previous `.next()` call.
  yield result + ' 2';
});
```

Конечно, ничего не сработает, если не запустить — что насчет промиса, который возвращает окончательное значение?

```js
// Returns a promise and kicks things
// off with the first `next()` call.
// The callback resolves the promise.
const gensync = (fn) =>
    (...args) => new Promise(resolve => {
  next(fn(...args), val => resolve(val));
});
```

Давайте взглянем на все вместе: на 22 строки кода, за исключением примера использования:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';

const next = (iter, callback, prev = undefined) => {
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};

const gensync = (fn) =>
    (...args) => new Promise(resolve => {
  next(fn(...args), val => resolve(val));
});



/* How to use gensync() */

const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const asyncFunc = gensync(function* () {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
});

// Call the async function and pass params.
asyncFunc('param1', 'param2', 'param3')
  .then(val => console.log(val)); // 'future value 2'
```

Теперь, если вам нужно использовать эту технику в коде, используйте [Co.js](https://github.com/tj/co). У нее есть обработка ошибок (которую я пропустил, чтобы не загромождать пример), она протестирована на практике, у нее есть несколько других приятных функций.

### От промисов к Observable

Приведенный выше пример интересен, и Co.js действительно полезен для упрощения управления асинхронным потоком. Есть только одна проблема: Co.js возвращает промисы. Как вы, вероятно, знаете, **промис может выдать только одно значение или отказ...**

Генератор способен выдавать **множество значений в произвольный момент времени**. Что еще может выдавать множество значений в произвольный момент времени? **Observable**. В статье «[7 выводов, которые я сделал, когда писал генератор последовательности Фибоначчи на JavaScript]()» я писал:

> Сначала меня заинтересовали генераторы, но я изучил их подробнее и нашел довольно мало способов применить их при написании реального кода приложения. В большинстве случаев я использую [RxJS](https://github.com/Reactive-Extensions/RxJS) вместо генераторов, потому что у него намного более богатый API.

_В отличие от генератора_, промис выдает всего только одно значение. _Как генератор_, observable выдает множество значений. Я считаю, что Observable API намного лучше подходит для асинхронных функций, чем промис.

#### Что такое Observable?

![](images/hidden-power-1.png)


Выше приведена таблица из [GTOR: A General Theory of Reactivity](https://github.com/kriskowal/gtor) Криса Коваля (Kris Kowal). Она точно описывает связь с пространством и временем. Значения, которые можно получить синхронно, занимают пространство (значения в памяти) и отделены от времени. Это **pull API**.

Значения, зависящие от некоторого события во времени, нельзя использовать синхронно. Чтобы использовать значения, сначала нужно их получить. Это **push API**, у них всегда есть какой-то механизм уведомления. В JavaScript push API обычно принимает форму функции обратного вызова.

Если вы работаете с будущими значениями, когда значение станет доступным, вы получите уведомление. Это **push**.

Промис — это push-механизм, который возвращает код после того, как был получен результат промиса (разрешено или отклонено) с одним значением.

Observable похож на промис, но он возвращает код каждый раз, когда новое значение становится доступным и _может генерировать множество значений в произвольный момент времени_.

Основной функцией Observable является метод `.subscribe()`, который принимает три значения:

- **onNext** — Возвращается каждый раз, когда observable генерирует значение.
- **onError** —  вызывается, когда Observable сталкивается с ошибкой или не может генерировать данные для обработки. После ошибки никакие дополнительные значения не будут сгенерированы, и `onCompleted` не будет вызван.
- **onCompleted** — Вызывается после последнего вызова `onNext`, но только в том случае, если ошибки не встречались.

Итак, если мы хотим реализовать Observable API для асинхронных функций, похожих на синхронные, нам нужен простой способ задать эти параметры. Оставим `onError` на потом и рассмотрим такой пример:

```js
const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';

const next = (iter, callbacks, prev = undefined) => {
  const { onNext, onCompleted } = callbacks;
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) {
    return onCompleted();
  }

  if (isPromise(value)) {
    value.then(val => {
      onNext(val);
      setImmediate(() => next(iter, callbacks , val));
    });
  } else {
    onNext(value);
    setImmediate(() => next(iter, callbacks, value));
  }
};

const gensync = (fn) => (...args) => ({
  subscribe: (onNext, onError, onCompleted) => {
    next(fn(...args), { onNext, onError, onCompleted });
  }
});


/* How to use gensync() */

const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const myFunc = function* (param1, param2, param3) {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
  yield param1;
  yield param2;
  yield param3;
}

const onNext = val => console.log(val);
const onError = err => console.log(err);
const onCompleted = () => console.log('done.');

const asyncFunc = gensync(myFunc);

// Call the async function and pass params.
asyncFunc('a param', 'another param', 'more params!')
  .subscribe(onNext, onError, onCompleted);
// future value
// future value 2
// a param
// another param
// more params!
// done.
```

Мне очень нравится эта версия: мне кажется, что она гораздо более универсальна. На самом деле, мне она нравится настолько, что я немного изменил ее, переименовал в Ogen, добавил обработку ошибок и истинный объект Rx Observable: теперь можно использовать `.map()`, `.filter()`,`.skip()` и [много другое](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/main/rx.md#observable-instance-methods).

Найти Ogen вы можете на [GitHub](https://github.com/ericelliott/ogen).

Observable улучшает управление асинхронным потоком несколькими разными способами. Именно поэтому я больше не использую генераторы так часто, как раньше. Тем не менее, теперь я умею с легкостью комбинировать и сопоставлять асинхронный код и Observable с Ogen: это значит, что я начну использовать генераторы намного чаще.
