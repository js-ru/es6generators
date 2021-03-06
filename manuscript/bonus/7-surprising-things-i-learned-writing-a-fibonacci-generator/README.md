# 7 выводов, которые я сделал, когда писал генератор последовательности Фибоначчи на JavaScript {#7-surprising-things-i-learned-writing-a-fibonacci-generator}

*Перевод статьи Eric Elliott: [7 Surprising Things I Learned Writing a Fibonacci Generator in JavaScript](https://medium.com/javascript-scene/7-surprising-things-i-learned-writing-a-fibonacci-generator-4886a5c87710)*

*Дата публикации: 15.05.2016*

![Раковина наутилуса — Dave Spindle (CC-BY-NC-2.0)](images/fibonacci.jpeg)

Генераторы — это новый вид функций в JavaScript, введённый в ES6. Чтобы подробнее изучить их, я решил написать функцию генератора Фибоначчи.

Вот что я узнал.

## Новые функции 

Если в языке появляется новая функциональная возможность (она же _фича_), я сразу же изучаю её и начинаю активно использовать: так произошло и с несколькими возможностями ES6. Я составил список любимых фич ES6 и назвал его [ROAD MAP](https://ericelliottjs.com/product/es6-the-road-map-2-hour-webcast-recording/):

- **R** Операторы Rest/Spread
- **O** Объектные литералы
- **A** Стрелочные функции
- **D** Деструктуризация и параметры по умолчанию
- —
- **M** Модули
- **A** Асинхронное программирование **P** (промисы и генераторы)


Когда я составлял список, мне казалось, что это самые полезные возможности ES6. Сначала меня заинтересовали генераторы, но я изучил их подробнее и нашёл довольно мало способов применить их при написании реального кода приложения. В большинстве случаев я использую [RxJS](https://github.com/Reactive-Extensions/RxJS) вместо генераторов, потому что у него намного более богатый API.

Это не означает, что генераторы негде применить. Я все жду, когда в движке JS появится улучшенная поддержка генераторов. Может быть я просто не могу придумать применение генераторам? Лучший способ это исправить — больше практиковаться.

Первый способ, который сразу же пришёл мне в голову, когда я узнал про генераторы— их можно использовать для захвата значений из любого бесконечного ряда. Этот способ можно применить во множестве сфер: при обработке графических алгоритмов и уровней компьютерных игр, в музыкальных секвенсорах и т. д.

## Что такое последовательность Фибоначчи?

Фибоначчи — простой, канонический пример, который, скорее всего, вам уже знаком.

Последовательность Фибоначчи представляет собой ряд чисел:

*0, 1, 1, 2, 3, 5, 8, 13, 21, 34…*

После *0* и *1*, начальных значений, каждое последующее число представляет собой сумму двух предыдущих чисел. Интересное свойство этой последовательности в том, что отношение текущего числа к предыдущему числу в последовательности равняется *1.61803398875…*, то есть золотому соотношению.

Последовательность Фибоначчи можно использовать, чтобы генерировать разные интересные вещи: например, Золотую спираль, которая встречается в природе.

## Что такое функция-генератор?

Функции генератора — это новая возможность в ES6, позволяющая функции *генерировать множество значений на протяжении определённого времени*, путём возврата объекта, который можно перебрать для получения из него по одному значению за раз.

Если вместо прямого возврата значения мы используем функцию-генератор, то она возвращает объект-итератор.

### Протокол «Итератор»

Объект-итератор использует метод `.next ()`. При использовании этого метода, тело функции возобновляется после последней строки, в которой был использован `.next ()`. Так продолжается до тех пор, пока не будет достигнута выражение `yield`, и в этот момент возвращается такой объект:

```js
{
  value: Any,
  done: Boolean
}
```

Свойство `value` содержит возвращённое (yielded) значение, а `done` указывает, действительно ли генератор выдал последнее значение.

Протокол «Итератор» активно используется в JavaScript: в новом цикле `for…of`, стрелочных функциях, операторах rest/spread и т.д.

## 1. Генераторам не нравится рекурсия

Я часто беспокоюсь насчёт рекурсии в JavaScript. Если функция вызывает другую функцию, для хранения состояния данных функции выделяется новый стековый кадр. Бесконечная рекурсия может привести к проблемам с памятью, поскольку существует ограничение на количество стековых кадров. Если это максимальное число стековых кадров превышено, происходит переполнение стека.

Переполнение стека похоже на полицию, которая приезжает на вечеринку и требует разойтись по домам. Это портит все веселье.

Я был рад, когда в ES6 появилась оптимизация хвостового вызова, которая позволяет рекурсивной функции повторно использовать один и тот же стековый кадр для каждой итерации. Однако оптимизация работает только, когда вызов с рекурсией находится в хвостовой позиции, то есть, если функция возвращает результат вызова с рекурсией без каких-либо дальнейших вычислений.

Отлично! Это моя первая примитивная реализация: она основана на каноническом математическом определении последовательности Фибоначчи:

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

Мне нравится, насколько понятно получилось. Начальные значения видны в сигнатуре функции, в рекурсивном вызове видна формула.

Условие `if` позволяет завершить цикл, используя` return` вместо `yield`, если` n` достигнет нуля. Если цикл не достигнет`n`, он будет обозначен как `undefined`. Если мы пытаемся вычесть `1`, то получим результат `NaN`, поэтому функция никогда не прекратится.

Эта реализация очень проста и примитивна. Когда я начал тестировать её с большими значениями, она не сработала.

(ಥ﹏ಥ)

К сожалению, **оптимизация хвостовых вызовов не распространяется на генераторы**. В спецификации вызова функции [Runtime Semantics: Evaluation](https://tc39.github.io/ecma262/#sec-function-calls) написано:

7. Пусть `tailCall` будет `IsInTailPosition(thisCall)`.

8. Возврат `EvaluateDirectCall(func, thisValue, Arguments, tailCall)`.

**IsInTailPosition** возвращает значение `false` для генераторов(см.[14.6.1](https://tc39.github.io/ecma262/#sec-tail-position-calls)):

5. Если `body` является `FunctionBody` по отношению к `GeneratorBody`, возвращается значение `false`.

Другими словами, **избегайте рекурсии в бесконечных генераторах**. Вместо этого используйте итеративную форму, если хотите избежать переполнения стека.

> **Поправка**: Несколько месяцев назад мне нравилась оптимизация хвостовых вызовов в Babel, но впоследствии её удалили. Насколько я знаю, сейчас [только Webkit (Safari, Mobile Safari) поддерживает новые хвостовые вызовы ES6 из-за проблем с разработчиками движка](https://kangax.github.io/compat-table/es6/).

Немного изменив код, мы можем удалить рекурсию и вместо неё использовать итеративную форму:

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

Как вы видите, мы по-прежнему выполняем тот же самый обмен значениями переменных, что и в исходной сигнатуре вызова функции. Однако на этот раз мы используем деструктурирующее присваивание внутри цикла while. Нам нужен использовать `isInfinite` в генераторе, если мы не достигнем предела.

## 2. Установка предельного числа итераций

Можно извлечь массив из генератора, используя деструктурирующее присваивание и rest-синтаксис:

```js
const [...arr] = generator(8);
```

Но если генератор в вашем случае представляет собой бесконечный ряд, и вы не можете задать лимит через параметры, полученный массив не прекратит заполняться.

В обеих описанных выше реализациях последовательности Фибоначчи мы разрешаем инициатору вызова пройти `n`, который ограничивает последовательность до первых чисел `n`. Все хорошо!

┬─┬ ノ( ゜-゜ノ)

## 3. Будьте осторожнее с мемоизацией функций

Очень заманчивая идея — мемоизировать что-то похожее на последовательность Фибоначчи: мемоизация значительно уменьшит количество требуемых итераций. Другими словами, она **сильно ускоряет процесс**.

### Что такое мемоизация?

Существуют функции, которые всегда производят один и тот же вывод с теми же аргументами. Результаты этих функций можно записать в память и использовать в дальнейшем, чтобы работа по вычислению результатов не повторялась. Вместо повторного вычисления результат этой функции возвращается из памяти. Чтобы выдать результаты, алгоритм Фибоначчи повторяет множество вычислений: если мемоизировать эту функцию, можно сэкономить много времени.

Давайте посмотрим, как можно мемоизировать итеративную форму генератора Фибоначчи:

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

Поскольку `n` по существу представляет индекс в массиве чисел, мы можем использовать его в качестве индекса ассоциативного массива. Последующие вызовы будут просто искать этот индекс и возвращать соответствующее значение результата.

### Поправка:

Исходная версия этого кода содержала ошибку. В первый раз, когда вы запустили эту функцию, все будет работать нормально, но мемоизация была проведена неправильно. Вы не сможете просто задать значение— в отличие от `return`, ` yield` не останавливает запуск остальных функций. Он просто приостанавливает выполнение до тех пор, пока команда `.next ()` не будет вызвана снова.

Разобраться с этим моментом было довольно сложно. `yield` — это не просто `return` для генераторов. В данном случае нужно придумать, как именно возобновить функции с помощью next ().

В этом случае я использовал `yield`, но это затрудняло чтение потока управления.

Чтобы облегчить чтение, я отделяю функцию генератора от потока управления при мемоизации.

Как вы можете видеть, новая функция генератора чрезвычайно проста — она ​​просто вычисляет массив memo, вызывает из памяти `fib()`, а затем делегирует генератор полученному итерируемому массиву, используя `yield *`.

`yield *` — это специальная форма `yield`, которая будет делегировать другой или итерируемому генератору. Например:

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

### Производительность (бенчмарки)

Всякий раз, когда я работаю с конкурирующими реализациями алгоритмов, я обычно пишу простой тестовый скрипт для сравнения производительности.

В этом случае я сгенерировал по 79 чисел. Я использовал Node-процесс `process.hrtime()` для записи точных таймингов для обеих реализаций, протестировал три раза и усреднил результаты:

![](images/fibonacci-2.png)

Как видите, разница довольно значительная. Если вы хотите быстро сгенерировать много чисел, выбирайте мемоизацию.

Есть одна проблема: в случае с бесконечным рядом массив memo будет расти. В конце концов, вы столкнётесь с лимитом размера динамической памяти, и это приведёт к сбою JS-движка.

Не беспокойтесь. В случае с последовательностью Фибоначчи вы столкнётесь с максимальным точным размером целого числа в JavaScript, который составляет *9007199254740991*. Это более **9 квадриллионов** — это довольно большое число, **но не для последовательности Фибоначчи**: до 9 квадриллионов вы доберётесь, сгенерировав всего 79 чисел.

## 4. JavaScript нужно встроенное API для точного расчёта времени

Каждый раз, когда я пишу простой тестовый скрипт, я хочу, чтобы API-интерфейс с точной синхронизацией работал как в браузерах, так и в Node. Однако, таких интерфейсов нет. Самое подходящее решение — библиотека, которая предоставляет интерфейс, который объединяет API браузера `performance.now()` и API Node `process.hrtime()`, чтобы в конечном счёте иметь единый API. Однако в этом случае достаточно только тестов Node.

Единственная проблема в том, что `process.hrtime()` для Node возвращает массив вместо простого значения в наносекундах. Это, однако, легко поправить:

```js
const nsTime = (hrtime) => hrtime[0] * 1e9 + hrtime[1];
```

Просто верните в эту функцию массив с помощью `process.hrtime ()` и вы получите привычные нам наносекунды. Давайте посмотрим на тестовый скрипт, который я использовал для сравнения итерационного генератора Фибоначчи с версией из памяти:

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

С помощью моей любимой функции `hrtime()` можно передать время начала в функцию, чтобы получить время, прошедшее с момента запуска — именно это и нужно для профилирования.

Иногда процессам везёт с планировщиком задач ОС: поэтому подобные скрипты я запускаю несколько раз и усредняю результаты.

Я уверен, что есть более точные способы сравнить свой код, но мой метод подходит для большинства ситуаций, особенно для сравнения реализаций последовательности Фибоначчи.

## 5. Избегайте случайных ошибок точности с плавающей точкой

Я не хочу утомлять вас слишком сложной математикой, но знаете ли вы, что существует очень эффективный способ вычисления Фибоначчи без итераций или рекурсии? Он выглядит так:

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

Единственная проблема — ограничение точности плавающей точки. Фактическая формула не включает округление. Я добавил его, потому что ошибки с плавающей точкой начинают приводить к искажению результатов после `n = 11`. Не впечатляет.

Хорошая новость: если добавить округление, можно повысить точность до `n = 75`. Намного лучше. Это всего лишь несколько цифр, около максимального точного значения ` n = 79`.

Итак, до значения `n = 75`, эта быстрая формула работает отлично! Давайте превратим её в генератор:

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

Выглядит хорошо. Давайте посмотрим бенчмарк:

```
Profile with 79 numbers
    original: 901643ns
    memoized: 544423ns
    formula:  311068ns
```

Да, так быстрее, но мы потеряли точность нескольких последних цифр. Стоит ли идти на такой компромисс?

¯\(º_o)/¯

## 6. Понимайте свои ограничения

Прежде, чем я начну:

- Я понятия не имел, сколько точных значений можно было бы сгенерировать, используя стандартный JavaScript-тип `Number`.
- Я понятия не имел, сколько точных значений можно сгенерировать с помощью этой версии формулы.
- Я понятия не имел, сколько рекурсивных вызовов понадобится, чтобы получить настолько точные значения.

Но теперь, я понимаю все эти ограничения. На данный момент эта реализация показала себя лучше всего:

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

В большинстве случаев, если я использую бесконечный ряд на практике, в реальном приложении, мне требуется ограниченное количество значений для определённой цели (обычно для создания графики). В большинстве случаев быстрее всего взять значения из **таблицы поиска**, а не вычислять их. Фактически, такую оптимизацию часто использовали в компьютерных играх 80-х и 90-х годов. Вероятно, она используется и сейчас.

Поскольку массивы в ES6 являются итерируемыми и уже по умолчанию работают как генераторы, мы можем просто работать с таблицей поиска с помощью `yield *`.

Неудивительно, что это самая быстрая реализация в данном случае:

```
Profile with 79 numbers
    original: 890088ns
    memoized: 366415ns
    formula:  309792ns
    lookup:   191683ns
```

Сейчас я почти уверен, что без ограничения серии точными значениями, стек вызовов работает исправно. Слегка изменённая рекурсивная версия, вероятно, тоже сработает:

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

Начальные значения можно добавить в память, приблизив фактический расчёт к математическому рекуррентному соотношению: _Fn = Fn-1 + Fn-2_

Генератору мы просто делегируем массив memo.

### Какие ограничения нужно принимать во внимание?

- Если вы используете формулу с плавающей точкой, нужно обязательно проверить пределы точности.
- Если вы используете экспоненциально растущий ряд, нужно выяснить, когда будет достигнут лимит JS-типа `Number`.
- При низком лимите, предварительного сгенерируйте таблицу поиска, чтобы ускорить производительность приложения.

Если вам нужны более точные числа, чем те, что JavaScript может представить изначально, у вас есть такая возможность: воспользуйтесь библиотеками целочисленного размера произвольного размера, такими как [BigInteger](https://github.com/peterolson/BigInteger.js).

## 7. Многие функции работают как генераторы

Когда функции генератора были введены в ES6, во многих других встроенных функциях также был реализован **протокол итератора** (возврат из генератора, который может быть повторён).

Точнее, в них реализован протокол итерации. `String`,` Array`, `TypedArray`,` Map` и `Set` содержат встроенный протокол итерации, что означает, что все они имеют перечислимое свойство `[Symbol.iterator]`.

Другими словами, теперь можно перебирать любой объект, подобный массиву, используя метод итератора `.next()`.

Таким образом можно получить доступ к итератору массива. Техника такая же для всего, что реализует итерируемый протокол:

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

Также есть возможность создавать собственные пользовательские итерации:

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

Можно даже переопределять встроенные итеративные поведения, но будьте осторожны — встречается непоследовательное поведение между Babel и V8:

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

Я подумал, что было бы удобно написать функцию-ярлык для `arr[Symbol.iterator]()`. Я создал функцию-ярлык с API-интерфейсом, чтобы можно было захватывать куски массива и превращать их в итераторы. Я назвал его arraygen, вы можете найти [его на GitHub](https://github.com/ericelliott/arraygen)).

## Заключение

Надеюсь, я затронул некоторые вещи, которые вы, возможно, не знали о генераторах. Я также хотел бы упомянуть пару интересных моментов:

- **Избегайте рекурсии**. Генераторы не оптимизируют хвостовые вызовы.
- **Задайте лимит длины генераторов** и используйте оператор … rest, чтобы превысить лимит.
- **Используйте мемоизацию бесконечных генераторов, чтобы ограничить размер динамической памяти**. 
- **JavaScript имеет два конкурирующих API для точного расчёта времени**. Почему мы не можем работать вместе? (ಥ﹏ಥ)
- **Ошибки точности с плавающей точкой могут отключать бесконечные генераторы на основе формулы**. Здесь нужно быть внимательнее.
- **Понимайте свои ограничения**. Подходит ли используемый вами генератор для вашего приложения? Достаточно ли точен этот генератор на протяжении всей выборки? Столкнётесь ли вы с ограничениями типа используемых данных? Будет ли у JS-накопителя достаточно памяти, чтобы генератор работал, сколько нужно?
- **Большинство встроенных функций ведут себя как генераторы** с итерируемым протоколом: также можно добавить свои собственные пользовательские итерации.

Если вы хотите подробнее ознакомиться с примерами Фибоначчи, [склонируйте полный пример из GitHub](https://github.com/learn-javascript-courses/fibonacci).

