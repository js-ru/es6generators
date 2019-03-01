# Пишем современный асинхронный Javascript код, используя промисы, генераторы и корутины

![](images/modern.jpeg)

На протяжении многих лет патерн разработки “Callback Hell” (также известный как «The Pyramid of Doom» - прим. переводчика) часто упоминался как один из самых ненавистных в Javascript для управления параллелизмом. На всякий случай, если вы забыли на что это похоже, вот пример изменения и обработки данных c помощью транзакции в Express:

```js
app.post("/purchase", (req, res) => {
    user.findOne(req.body, (err, userData) => {
        if (err) return handleError(err);
        permissions.findAll(userData, (err2, permissions) => {
            if (err2) return handleError(err2);
            if (isAllowed(permissions)) {
                transaction.process(userData, (err3, confirmNum) => {
                    if (err3) return handleError(err3);
                    res.send("Your purchase was successful!");
                });
            }
        });
    });
});
```

## Промисы должны были спасти нас от…

Я уже рассказывал, что промисы могут позволить нам JavaScript-разработчикам писать асинхронный код, так как будто мы пишем его синхронно, если обернуть наши асинхронные функции в специальный объект

Чтобы получить доступ к значению промиса, мы вызываем либо `.then`, либо `.catch` у этого промис-объекта. Но что произойдёт, когда мы попытаемся реорганизовать приведённый выше пример с помощью промисов?


```js
// all asynchronous methods have been promisified
app.post("/purchase", (req, res) => {
    user.findOneAsync(req.body)
        .then( userData => permissions.findAllAsync(userData) )
        .then( permissions => {
            if (isAllowed(permissions)) {
                return transaction.processAsync(userData);
                // userData is not defined! It's not in the proper scope!
            }
        })
        .then( confirmNum => res.send("Your purchase was successful!") )
        .catch( err => handleError(err) )
});
```

Поскольку каждая функция внутри обратного вызова ограничена её областью видимостью, мы не можем получить доступ к объекту с описанием пользователя внутри второй функции обратного вызова **_.then_**.

После небольшого погружения в проблему, я так и не смог найти элегантного решение, но я нашёл то, что меня разочаровало:

> Просто вложите промисы так, чтобы они имели подходящую область видимости.

Вложить свои промисы!? Чтобы снова вернуться к «The Pyramid of Doom»?

```js
app.post("/purchase", (req, res) => {
    user.findOneAsync(req.body)
        .then( userData => {
            return permissions
                .findAllAsync(userData)
                .then( permissions => {
                    if (isAllowed(permissions)) {
                        return transaction.processAsync(userData);
                    }
            });
        })
        .then( confirmNum => res.send("Your purchase was successful!"))
        .catch( err => handleError(err) )
});
```

Я бы сказал, что версия c вложенными функциями обратного вызова выглядит более чистой и простой, чем версия с вложенными промисами.

## Async Await нас спасут!

Ключевые слова `async` и `await` позволят писать наш javascript-код, так как будто он синхронный. И этот код написан с их помощью, которые появятся в ES7:


```js
app.post("/purchase", async function (req, res) {
    const userData = await user.findOneAsync(req.body);
    const permissions = await permissions.findAllAsync(userData);
    if (isAllowed(permissions)) {
        const confirmNum = await transaction.processAsync(userData);
        res.send("Your purchase was successful!")
    }
});
```

К сожалению, большинство функций ES7, включая async/await, не были реализованы нативным образом и поэтому требуют использования транспилятора. Тем не менее, вы можете написать код, который выглядит точно так же, как приведённый выше код, используя функции ES6, которые были реализованы в большинстве современных браузеров, а также в NodeJS 4ой версии и выше.

## Динамичный дуэт: генераторы и корутины

Генераторы - превосходный инструмент для метапрограммирования. Они могут использоваться для таких вещей, как ленивые вычисления, итерирование по большим массивам данных, занимающих большое количество памяти, и обработка данных по требованию из нескольких источников данных с использованием библиотеки RxJs.

However, we wouldn’t want to use generators alone in production code because they forces us to reason about a process over time. And each time we call next, we jump back to our generator like a GOTO statement.

Однако мы бы не хотели бы использовать только одни генераторы в производственном коде, потому что они заставляют нас взглянуть на выполнение код как на какой-то длящийся во времени процесс. И каждый раз, когда мы вызываем `next`, мы возвращаемся к нашему генератору, как будто используем оператор GOTO.

Корутины понимают это и исправляют эту ситуацию, обёртывая генератор и абстрагируя всю сложность.

## Использование корутин в ES6

I> Корутины позволяют нам прерывать наши асинхронные функции на одной строке за раз, делая наш код синхронным.

Важно отметить, что я использую библиотеку Co. Корутина в Co исполняет генератор немедленно, в то время, когда корутина в Bluebird вернёт функцию, которую вы должны будете вызвать для запуска генератора.

```js
import co from 'co';
app.post("/purchase", (req, res) => {
    co(function* () {
        const person = yield user.findOneAsync(req.body);
        const permissions = yield permissions.findAllAsync(person);
        if (isAllowed(permissions)) {
            const confirmNum = yield transaction.processAsync(user);
            res.send("Your transaction was successful!")
        }
    }).catch(err => handleError(err))
});
```

Давайте определимся с некоторыми основными правила использования корутин:

1. Любая функция справа от **yield** должна вернуть промис.
2. Если вы хотите выполнить свой код в текущий момент времени, используйте **co**.
3. Если вы хотите выполнить свой код позже, используйте **co.wrap**.
4. Убедитесь, что цепочка **.catch** находится в конце вашей корутины для обработки ошибок. В противном случае вы должны обернуть свой код в блок try/catch.
5. Корутина **Promise.coroutine** из библиотеки `Bluebird` эквивалентна корутине **co.wrap** из библиотеки `Co`, но не функции `co`.


## Что делать, если я хочу выполнить несколько одновременных процессов?

Вы можете использовать или объекты или массивы с ключевым словом yield, а затем разрушить (destructure) результат.

### Пример характерный для библиотеки Co

```js
// Библиотека Co
import co from 'co';

// с объектами
co(function*() {
    const {user1, user2, user3} = yield {
        user1: user.findOneAsync({name: "Will"}),
        user2: user.findOneAsync({name: "Adam"}),
        user3: user.findOneAsync({name: "Ben"})
    };
).catch(err => handleError(err))

// с массивами
co(function*() {
    const [user1, user2, user3] = yield [
        user.findOneAsync({name: "Will"}),
        user.findOneAsync({name: "Adam"}),
        user.findOneAsync({name: "Ben"})
    ];
).catch(err => handleError(err))
```

### Пример использования библиотеки Bluebird

```js
// Библиотека Bluebird
import {props, all, coroutine} from 'bluebird';

// с объектами
coroutine(function*() {
    const {user1, user2, user3} = yield props({
        user1: user.findOneAsync({name: "Will"}),
        user2: user.findOneAsync({name: "Adam"}),
        user3: user.findOneAsync({name: "Ben"})
    });
)().catch(err => handleError(err))

// с массивами
coroutine(function*() {
    const [user1, user2, user3] = yield all([
        user.findOneAsync({name: "Will"}),
        user.findOneAsync({name: "Adam"}),
        user.findOneAsync({name: "Ben"})
    ]);
)().catch(err => handleError(err))
```
## Библиотеки, которые можно использовать уже сегодня:

- [Promise.coroutine | bluebird](http://bluebirdjs.com/docs/api/promise.coroutine.html)
- [co](https://www.npmjs.com/package/co)
- [Babel](https://babeljs.io/)
- [asyncawait](https://www.npmjs.com/package/asyncawait)
