# Promises: The LEGO problem (part 5) {#promises-getify-part-5}

A> This is a multi-part blog post series on the whys and hows and problems of Promises:
A>
A> * [Part 1: The Sync Problem](#promises-getify-part-1)
A> * [Part 2: The Inversion Problem](#promises-getify-part-2)
A> * [Part 3: The Trust Problem](#promises-getify-part-3)
A> * [Part 4: The Extension Problem](#promises-getify-part-4)
A> * [Part 5: The LEGO Problem](#promises-getify-part-5/)

In [Part 4: The Extension Problem](#promises-getify-part-4), I talked about how common creating extensions and abstractions on top of promises is, and some of the hazards therein. But why aren’t promises _good enough_ as is, at least for most developers? Is that what they were even designed to fit?

## I’ve Got Friends In Low Places

Promises are self-admittedly designed as a low-level building block. A promise is like a LEGO. In and of itself, the LEGO is only so interesting. But in putting them together, you get more interesting things.

The problem is that promises aren’t (necessarily by themselves) one of the really cool awesome custom LEGO pieces you may remember from your days as a kid. They’re not some fancy pneumatic pump from Technic, nor are they the Gandalf mini-figure.

No, promises are just your plain old (still useful!) 4×2 brick.

That doesn’t make them super useful. They’re one of the most important pieces in your bin. It’s just they only have so much they can _be_ when separate. It’s in the interesting combinations where their utility will really start to shine.

In other words, promises were essentially intended to be a low-level API that would be built upon for real users. That’s right: **promises weren’t really made for you, the developer**, they were made for the library author.

You’re going to benefit massively from them, but odds are you’re probably not going to use them directly as much as you might think. You’re going to use the _results_ of them in hundreds of different libraries.

## Control vs. Value

Allow me to bust the first and biggest misconception you may have about promises: **they aren’t _really_ about flow control**.

Promises can certainly be chained together to approximate something like async flow-control. But it turns out they’re not as _good_ at that task as you’re likely to need.

A promise is really just a container for a value. That value may be present now, or it may be a _future value_. But nevertheless, it’s just a value.

This is one of the most profound benefits of promises, though. They create a uniquely powerful abstraction on top of a _value_ that makes it non-temporal. In other words, it doesn’t matter if the value is there yet or not, you still reason about the promise in **exactly** the same way. In [Part 3: The Trust Problem](#promises-getify-part-3) I talked about about promises must be externally immutable, and this sense of them as _values_ is based entirely on that assertion.

Promises are like tiny, self-contained representations of state. They’re ultimately composable, which means your entire program can be represented by them. In that sense, the observation that Promises are really _functional_ concepts — they’re monads — bears itself out.

## Limitations

Just as you can’t expect a single 4×2 LEGO alone to _be_ a race-car, so too expecting promises to _be_ your async flow-control mechanism is asking a bit too much of them.

So what does this observation about the nature of a promise as a non-temporal, externally immutable value mean for using them to solve async tasks in our programs? It means that in the restraint of their design philosophy, there’s things they’re really good at and things they need help with.

I’m going to spend the rest of this post talking about these limitations. **But I’m not doing so as a criticism of Promises.** I’m doing so in an attempt to highlight the importance of extensions and abstractions.

### Error Handling

I fibbed a bit earlier when I said a promise is just a container for a value. Actually, it’s a container for either a successful value or a failure to get a value. At any given time, a promise is either a pending future value, a concrete successful value, or an error in getting the desired value. It’s never more than one of those.

In a sense, a promise is a decision structure, an `if..then..else`. Others like to think of it as a `try..catch` structure. Either way, you’re in a sense saying, “ask for a value, and either succeed or fail.”

As Yoda says, **“Do or do not, there is no try.”**

Consider:

```js
function ajax(url) {
    return new Promise( function(resolve,reject){
        // make some ajax request
        // if you get a response, `resolve( answer )`
        // if it fails, `reject( excuses )`
    } );
}

ajax( "http://TheMeaningOfLife.com" )
.then(
    winAtLife,
    keepSearching
);
```

See the `winAtLife()` and `keepSearching()` function references? We’re saying, “Go ask for the meaning of life. Either you find it or you don’t. Either way, then we move on.”

What if we left `keepSearching` out of the call? Aside from being an eternal optimist that assumes you will find it and win at life, what dangers are there?

If your promise fails to find the meaning of life (or, if some JavaScript error/exception happens while it’s working on the answer), it will silently hold onto that error fact, perhaps forever. Even if you [wait 10 million years like the Hitchhiker did](http://en.wikipedia.org/wiki/Phrases_from_The_Hitchhiker%27s_Guide_to_the_Galaxy#Answer_to_the_Ultimate_Question_of_Life.2C_the_Universe.2C_and_Everything_.2842.29), you will never _know_ that the request for the answer failed.

You can only _know_ that it failed by _observing_ it’s failure. Ooo, that could get into deeper metaphysical or quantum stuff. Let’s stop right there.

So, a promise without a failure handler is one that can silently fail. That’s no good. It means if you forget, you fall into the pit of failure, not the [pit of success](http://blog.codinghorror.com/falling-into-the-pit-of-success/).

So you may wonder: why can promises have the failure handler omitted? Because you may not care about the failure _now_, only later. And the natural temporality of our programs means, the system can’t know _now_ what you intend to do later. It may be perfectly valid for you to omit a failure handler _now_, because you know you’re about to chain off this promise to another one, and _that_ promise will have a failure handler.

So the Promises mechanism has to let you create promises where you can choose to _not_ observe the failure right away.

There’s a big problem even more subtle here, and probably where _most_ developers new to (and even seasoned with!) promises get tripped up.

### The Chains That Bind Us

To understand that problem, we first need to understand how exactly promises are chained together. I think you’ll quickly see that promise-chaining is both powerful and kinda complicated to dance around in your head.

```js
ajax( "http://TheMeaningOfLife.com" )
.then(
    winAtLife,
    keepSearching
)
// a second promise returned here that we ignored!
;
```

The `ajax(..)` call produces the **first promise**, and the `then(..)` call produces a **second promise**. We didn’t capture and observe that promise in this snippet, but we could have. The _second promise_ that was created and returned is automatically wired up to be fulfilled (success or failure) based on the how the **handling of the first promise** (in its success or failure) proceeds.

The _second promise_ wouldn’t care about the success or failure of the _first promise_ directly, so much as it would care about **handling** of that _first promise_‘s result.

That’s the key to promise-chaining. But it can be a little mind-bending, so re-read that until it makes sense.

Consider how promise code is usually written (with chains):

```js
ajax( ".." )
.then( transformResult )
.then(
    displayAnswer,
    reportError
);
```

That snippet could be rewritten like this, to the same effect:

```js
var promiseA = ajax( ".." );

var promiseB = promiseA.then( transformResult );

var promiseC = promiseB.then(
    displayAnswer,
    reportError
);

// we don't use `promiseC` here, but we could...
```

_Promise A_ is the only one who cares about the result of the `ajax(..)` request.

_Promise B_ only cares about how _Promise A_ is handled (not the results of _Promise A_ itself), inside the `transformResult(..)` function.

Likewise, _Promise C_ only cares about how _Promise B_ is handled (not the results of _Promise B_ itself), in either the `displayAnswer(..)` or `reportError(..)` functions.

Again, re-read those assertions to let them sink in.

Inside of `transformResult(..)`, if it does its task right away, then _Promise B_ will be completed right away, as either success or failure.

However, if `transformResult(..)` couldn’t complete right away, and were instead to create it’s own promise, then let’s call that conceptually _Promise H1_ (“H” for “hidden”, because it’s hidden above). The originally-returned _Promise B_, which was waiting to see how we handled _Promise A_ is now sorta **conceptually replaced by** _Promise H1_ (not really replaced technically, but just wired together).

So, now when you say `promiseB.then(..)`, it’s actually like saying `promiseH1.then(..)`. If _Promise H1_ succeeds, `displayAnswer(..)` will be called, but if it fails (directly or accidentally), `reportError(..)` will be called.

That’s how promise-chaining works.

* * *

**Note:** returning a promise (like _Promise H1_) to chain/replace only works from the success handler. Returning a promise from an error handler won’t do anything special.

* * *

But, what if _Promise A_ (from the ajax call) fails? The `promiseA.then( .. )` call doesn’t register a failure handler. Will it silently swallow the error? It _would_, except for the fact that we then chain off _Promise B_, and there we **do** register an error handler: `reportError(..)`. If _Promise A_ fails, `transformResult(..)` is never called, and there’s no error handler, so _Promise B_ is also immediately marked as failed, which is why `reportError(..)` will obviously be called.

What if _Promise A_ instead succeeds, and thus begins to run `transformResult(..)`, and while running `transformResult(..)`, there’s an error (either on purpose to fail, or by accident with a JS exception)? _Promise B_ will be marked as failed (even though _Promise A_ was a success), and thus `reportError(..)` would also be called.

**But here’s the dangerous part**, the part that’s so subtle that it’s so easy for even seasoned devs to miss!

What happens if _Promise A_ succeeds (successful `ajax(..)` call), and then _Promise B_ succeeds (successful `transformResult(..)` call), but while running `displayAnswer(..)`, there’s an error (or a failed/rejected promise returned)?

Might you think `reportError(..)` would/should be called? Most would probably think so. But… **nope**.

Why? Because an error or failed promise from `displayAnswer(..)` results in a failed **_Promise C_**. Are we listening for an failure condition from _Promise C_? Look closely. Look again. **Nope.**

To make sure you don’t miss **that** kind of error, and have it be silently swallowed up into the internal state of _Promise C_, you’ll also want to listen for failure of _Promise C_:

```js
var promiseC = promiseB.then(
    displayAnswer,
    reportError
);

// need to do this:
promiseC.then( null, reportError );

// or this:, which is the same thing:
promiseC.catch( reportError );

// Note: a silently ignored *Promise D* was created here!
```

OK, so now we’re catching the errors inside of `displayAnswer(..)`. Kinda sucks to have to remember to do that. Not exactly “pit of success”. But it’s a problem you _can_ train yourself to avoid.

### Turtles

But there’s an even more subtle problem! What if the `reportError(..)` function also has a JS exception in it while it’s running to handle reporting the error from `displayAnswer(..)`? Will anyone catch **_that_** error? **Nope.**

Look! There’s an implicit, discarded _Promise D_ above, and **it** would be notified of an exception inside `reportError(..)`.

**OMG**, you must be thinking. When does it ever stop? Is it turtles all the way down?

Some promise library authors think there’s a need to solve this problem by having those “silent errors” actually be thrown as global exceptions. But how should the mechanism know that you’re not going to chain off the promise and provide an error handler eventually? How would it know when it should report the error by global exception, or just keep its mouth shut? You certainly don’t want to spam the error console or logs with errors that your app is already catching and gracefully handling.

In a sense, you need be able to mark a promise as “final”, as in, “this is the final promise in my chain”, or: “I’m not going to chain anymore, so this is where the turtles stop”. If an error gets to the end of the chain and hasn’t been caught, **then and only then** should it be reported as a global exception. Seems sensible, on the surface, I suppose. One proposal under consideration goes like this:

```js
var promiseC = promiseB.then(
    displayAnswer,
    reportError
);

promiseC
.catch( reportError )
.done(); // marking the end of the chain
```

You still have to remember to call `done()`, otherwise errors can get swallowed into the internal state of the last promise. You have to **opt-in** to get solid error handling.

“Yuck!”, you must be thinking. This sucks more than we thought it was going to, doesn’t it? **Welcome to the fun world of promises.**

### Value vs. Values

Enough about errors specifically. Another limitation of the core promise concept is that a single promise represents a single (potentially future) value. What is a single value? It’s one object, or one array, or one string, or one number. Oh, wait, I can stick multiple values inside my value wrapper, like multiple elements in an array or object? Cool!

Meh.

The end result of an operation is not always naturally just one value, but promises have no facility for representing that idea, so it’s kind of a hack to wrap up multiple values into a container. It’s also quite subtle, and yet another **pit of failure**:

```js
function ajax(url) {
    return new Promise( function(resolve,reject){
        // make some ajax request
        // if you get a response, `resolve( answer, url )`
        // if it fails, `reject( excuses, url )`
    } );
}

ajax( ".." )
.then(
    function(answer,url){
        console.log( answer, url ); // ..  undefined
    },
    function(excuses,url){
        console.log( excuses, url ); // ..  undefined
    }
);
```

Did you catch what happened there? If you accidentally try to send more than one value through, either through the success or failure handlers, only the first value goes through, and the others are silently dropped.

Why? I believe this has something to do with predictability of composability, or some other fancy sequence of vocabulary words.

Bottom line, you’ll have to **remember** to do your own value-wrapping, or you’re going to silently lose data, and probably tear some of your hair out figuring out why.

### In-Parallel

Real world apps often have more than one thing that’s going to happen at the “same time”. In essence, there’s a natural need for a construct to handle, “do these two or more things in ‘parallel’, and wait for them all to finish”.

That’s an async flow-control type of problem, rather than a promises problem. A single promise itself cannot represent two or more async things happening “in parallel”. You need an abstraction layer to handle that.

In old school computer science terminology, that concept is called a “gate”. A _gate_ waits for all tasks to finish, irrespective of completion order, before proceeding.

In the promises world, we added a native static API helper called `Promise.all(..)`, which constructs a promise (much like `then(..)` does above) that waits for all promises in the passed array to complete before _it_ completes (or fails if any of the waited-upon promises fails).

<pre class="code">Promise.all([
    // these will all proceed "in parallel"
    makePromise1(),
    makePromise2(),
    makePromise3()
])
.then( .. );
</pre>

A common variation of `all(..)` (or the _gate_) is the _race_. It works the same way, except it proceeds whenever the first success/failure from any of the promises is signaled (and silently then ignores the rest of them as they complete). The native API for that abstraction is `Promise.race(..)`.

As you start to think about variations of these ideas (like waterfalls, retry-loops, etc), you can probably come up with dozens of different ways to abstract. `Promise.all(..)` and `Promise.race(..)` are provided natively, as they’re probably some of the most common tasks, but any others you’ll need regularly, you’ll need a library abstraction layer to do it.

Another symptom of this limitation is that you’ll quickly find yourself using `Array` helpers to manage lists of promises, like `.map(..)` and `.reduce(..)`. If you aren’t familiar with map/reduce, get familiar quickly, because you’ll find you need them frequently when dealing with real-world promises _sans_ abstractions.

Luckily, there are many abstractions out there already, and more being invented every day!

### Single Shot Of Espresso, Please!

Another natural thing about promises which is quite limiting is that they are fire-once-and-done.

This works great if you’re responding to a single event, like for instance a page or resource loading, but what if you have a repetitive event (like a user clicking on a button) that you want to fire off a sequence of async actions each time?

Promises themselves offer no such repetability, because they are [externally immutable](/web/20160315112316/http://blog.getify.com/promises-part-3), and thus cannot be “reset” to be refired. The only way to do it natively it to create a whole new promise chain for each event firing.

```js
$("#my_button").click(function(evt){
    doTask1( evt.target )
    .then( doTask2 )
    .then( doTask3 )
    .catch( handleError );
});
```

This sucks, not only because it’s in a sense less efficient to re-create the promise-chain each time, but also because it’s poor on SoC (separation of concerns). You have to mix the event listening with the event response in the same function setup call. It would be much nicer if there was a way to invert that paradigm, so that event listening and event handling could be separated concerns.

A pattern that is catching quick fire right now is the “reactive” pattern, which is an abstraction that allows a repeating event (such as the “data” event from a stream, etc) to fire off a sequence of async steps.

Microsoft’s [RxJS Reactive Extensions](https://rx.codeplex.com/) library calls this idea, roughly, “observables”.

My _asynquence_ library has a [`react(..)` plugin](https://github.com/getify/asynquence/tree/master/contrib#react-plugin) that provides a similar capability in a simpler fashion without as much fanfare.

### In The Land Of Blind…

In a world already dominated by APIs that use callbacks, inserting promises into the equation is somewhat more difficult than we’d like it to be. Consider:

```js
function myAjax(url) {
    return new Promise( function(resolve,reject){
        ajax( url, function(err,response){
            if (err) {
                reject( err );
            }
            else {
                resolve( response );
            }
        } )
    } );
}
```

Holy nested code, Batman! **Ugh.** I thought promises solved our callback hell? Well, they do, but they don’t save us from crap like this.

We need abstractions that make it easy to adapt promise signatures to callback signatures. Native promises don’t have these abstraction helpers, so the resulting code is often ugly. But it’s something that abstractions can easily make **much better**.

For instance, my _asynquence_ library provides an [`errfcb()` plugin](https://github.com/getify/asynquence/tree/master/contrib#errfcb-plugin) (error-first callback) that constructs a callback for you for just such occasions:

```js
function myAjax(url) {
    var sq = ASQ();
    ajax( url, sq.errfcb() );
    return sq;
}
```

Bam!

### Stop The Presses!

Sometimes, your app gets into a state where you want to stop it from doing anything else, while you recover. But what if you have currently pending promises at that moment?

```js
var pr = ajax( ".." )
.then( transformResult )
.then(
    displayAnswer,
    reportError
);

// Later
pr.cancel(); //  <-- doesn't work!
```

* * *

Quick pop quiz: which promise does `pr` refer to in that snippet? Think about it.

* * *

So, to cancel, you have to invent something like:

```js
function transformResult(data) {
    if (!pr.ignored) {
        // do something!
    }
}

var pr = ajax( ".." )
.then( transformResult )
.then(
    displayAnswer,
    reportError
);

// Later
pr.ignored = true; // just hacking around
```

In other words, you added a layer on top of promises (an abstraction) that properly handles canceling the side effects of an inevitable promise resolution.

You can’t unregister handlers from a promise. And because a promise has to be externally immutable (see [Part 3: The Trust Problem](/web/20160315112316/http://blog.getify.com/promises-part-3)), it would be a violation of the promises principle if you could directly “cancel” a promise. Canceling a promise from the outside is **no different from** mutating its state externally. It makes the promise untrustable.

Many promises libraries are proposing to provide exactly this kind of capability, but it’s a mistake all the way around. Cancelation is not something that belongs _on_ a promise, but instead on an abstraction layer on top of promises, just as we showed.

### Verbosity

Another, admittedly more minor, concern with the native promises low-level API is that certain things are not assumed, and so you have to manually do them, which is great for flexibility but often can lead to tiresome boilerplate.

As one example, at each completion step of a promise (the `then(..)` call), there’s an assumption that you may want to keep chaining, so it automatically returns a _new promise_ from the `then(..)` call. _But_, if you want to hook into that promise, you have to create your own promise (a third one!), and return it from a success handler, so that your promise is wired into the flow-control of the chain.

```js
function transformResult(data) {
    // we have to manually create and return a promise here
    return new Promise( function(resolve,reject){
        // whatever
    } );
}

var pr = ajax( ".." )
.then( transformResult )
.then(
    displayAnswer,
    reportError
);
```

Otherwise, as explained above, the hidden promise returned from the first `then(..)` call just immediately fulfills (or rejects), and you get no way to async defer the rest of the chain.

It would be nice if an abstraction layer could expose the automatically created/chained promise to you in some way, so that you didn’t _have to_ create your own promise to “replace” it with.

In other words, it would be nice if there was an assumption that you actually want to _use_ the chaining for async purposes, rather than that you just want it to nicely proceed synchronously.

Another nitpick example: you can’t pass an existing promise directly to a `then(..)` function, you have to pass a function that returns that promise.

```js
var pr = doTask2();

doTask1()
.then( pr ); // would be nice, but doesn't work!

// instead:

doTask1()
.then( function(){ return pr; } );
```

There’s reasons for this limitation, for sure, but it just detracts from the simplicity of usage in favor of the preservation of flexibility and predictability. Abstractions can (and do!) easily solve this nitpick.

## All `.done()`

All these reasons, and more, are reasons why the low-level native Promise API is simultaneously quite powerful **and** quite limited.

It’s a ground ripe for innovation in extension and abstraction. Many libraries are doing just that. As I’ve mentioned before, [asynquence](http://github.com/getify/asynquence) is my own entry into the promises-abstraction space. It’s tiny, but **very powerful**. Indeed, it solves basically **all of the problems** listed in this post, and more.

I will be writing a detailed post soon about how _asynquence_ solves the issues detailed here in this post, so keep your eye out.
