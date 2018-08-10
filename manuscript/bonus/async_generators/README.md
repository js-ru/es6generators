# Going Async With ES6 Generators

*Перевод статьи Kyle Simpson: [Going Async With ES6 Generators](https://davidwalsh.name/async-generators)*

*Дата публикации: 03.08.2014*

Now that you've [seen ES6 generators](bonus/es6_generators_basic/README.md) and are [more comfortable](bonus/es6_generators_dive/README.md) with them, it's time to really put them to use for improving our real-world code.

The main strength of generators is that they provide a single-threaded, synchronous-looking code style, **while allowing you to hide the asynchronicity away as an implementation detail**. This lets us express in a very natural way what the flow of our program's steps/statements is without simultaneously having to navigate asynchronous syntax and gotchas.

In other words, we achieve a nice **separation of capabilities/concerns**, by splitting up the consumption of values (our generator logic) from the implementation detail of asynchronously fulfilling those values (the `next(..)` of the generator's iterator).

The result? All the power of asynchronous code, with all the ease of reading and maintainability of synchronous(-looking) code.

So how do we accomplish this feat?

## Simplest Async

At its most simple, generators don't need anything *extra* to handle async capabilities that your program doesn't already have.

For example, let's imagine you have this code already:

```js
function makeAjaxCall(url,cb) {
    // do some ajax fun
    // call `cb(result)` when complete
}

makeAjaxCall( "http://some.url.1", function(result1){
    var data = JSON.parse( result1 );

    makeAjaxCall( "http://some.url.2/?id=" + data.id, function(result2){
        var resp = JSON.parse( result2 );
        console.log( "The value you asked for: " + resp.value );
    });
} );
```

To use a generator (without any additional decoration) to express this same program, here's how you do it:

```js
function request(url) {
    // this is where we're hiding the asynchronicity,
    // away from the main code of our generator
    // `it.next(..)` is the generator's iterator-resume
    // call
    makeAjaxCall( url, function(response){
        it.next( response );
    } );
    // Note: nothing returned here!
}

function *main() {
    var result1 = yield request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = yield request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
}

var it = main();
it.next(); // get it all started
```

Let's examine how this works.

The `request(..)` helper basically wraps our normal `makeAjaxCall(..)` utility to make sure its callback invokes the generator iterator's `next(..)` method.

With the `request("..")` call, you'll notice it has *no return value* (in other words, it's `undefined`). This is no big deal, but it's something important to contrast with how we approach things later in this article: we effectively `yield undefined` here.

So then we call `yield ..` (with that `undefined` value), which essentially does nothing but pause our generator at that point. It's going to wait until the `it.next(..)` call is made to resume, which we've queued up (as the callback) to happen after our Ajax call finishes.

But what happens to the *result* of the `yield ..` expression? We assign that to the variable `result1`. How does that have the result of the first Ajax call in it?

Because when `it.next(..)` is called as the Ajax callback, it's passing the Ajax response to it, which means that value is getting sent back into our generator at the point where it's currently paused, which is in the middle of the `result1 = yield ..` statement!

That's really cool and super powerful. In essence, `result1 = yield request(..)` is **asking for the value**, but it's (almost!) completely hidden from us -- at least us not needing to worry about it here -- that the implementation under the covers causes this step to be asynchronous. It accomplishes that asynchronicity by hiding the pause capability in yield, and separating out the resume capability of the generator to another function, so that our main code is just making a **synchronous(-looking) value request**.

The exact same goes for the second `result2 = yield result(..)` statement: it transparently pauses & resumes, and gives us the value we asked for, all without bothering us about any details of asynchronicity at that point in our coding.

Of course, `yield` is present, so there is a subtle hint that something magical (aka async) *may occur* at that point. But `yield` is a pretty minor syntactic signal/overhead compared to the hellish nightmares of nested callbacks (or even the API overhead of promise chains!).

Notice also that I said "may occur". That's a pretty powerful thing in and of itself. The program above always makes an async Ajax call, but **what if it didn't?** What if we later changed our program to have an in-memory cache of previous (or prefetched) Ajax responses? Or some other complexity in our application's URL router could in some cases fulfill an Ajax request *right away*, without needing to actually go fetch it from a server?

We could change the implementation of `request(..)` to something like this:

```js
var cache = {};

function request(url) {
    if (cache[url]) {
        // "defer" cached response long enough for current
        // execution thread to complete
        setTimeout( function(){
            it.next( cache[url] );
        }, 0 );
    }
    else {
        makeAjaxCall( url, function(resp){
            cache[url] = resp;
            it.next( resp );
        } );
    }
}
```

**Note:** A subtle, tricky detail here is the need for the `setTimeout(..0)` deferral in the case where the cache has the result already. If we had just called `it.next(..)` right away, it would have created an error, because (and this is the tricky part) the generator is not technically in a paused state *yet*. Our function call `request(..)` is being fully evaluated *first*, and then the `yield` pauses. So, we can't call `it.next(..)` again yet immediately inside `request(..)`, because at that exact moment the generator is still running (`yield` hasn't been processed). But we *can* call `it.next(..) "later", immediately after the current thread of execution is complete, which our `setTimeout(..0)` "hack" accomplishes. **We'll have a much nicer answer for this down below.**

Now, our main generator code still looks like:

```js
var result1 = yield request( "http://some.url.1" );
var data = JSON.parse( result1 );
..
```

**See!?** Our generator logic (aka our *flow control*) didn't have to change **at all** from the non-cache-enabled version above.

The code in `*main()` still just asks for a value, and *pauses* until it gets it back before moving on. In our current scenario, that "pause" could be relatively long (making an actual server request, to perhaps 300-800ms) or it could be almost immediate (the `setTimeout(..0)` deferral hack). But our flow control doesn't care.

That's the real power of **abstracting away asynchronicity as an implementation detail**.

## Better Async

The above approach is quite fine for simple async generators work. But it will quickly become limiting, so we'll need a more powerful async mechanism to pair with our generators, that's capable of handling a lot more of the heavy lifting. That mechanism? **Promises**.

If you're still a little fuzzy on ES6 Promises, I wrote an extensive [5-part blog post series](http://blog.getify.com/promises-part-1/) all about them. Go take a read. I'll *wait* for you to come back. &lt;chuckle, chuckle&gt;. Subtle, corny async jokes ftw!

The earlier Ajax code examples here suffer from all the same [Inversion of Control](http://blog.getify.com/promises-part-2/) issues (aka "callback hell") as our initial nested-callback example. Some observations of where things are lacking for us so far:

1. There's no clear path for error handling. As we [learned in the previous post](bonus/es6_generators_dive), we *could) have detected an error with the Ajax call (somehow), passed it back to our generator with `it.throw(..)`, and then used `try..catch` in our generator logic to handle it. But that's just more manual work to wire up in the "back-end" (the code handling our generator iterator), and it may not be code we can re-use if we're doing lots of generators in our program.
2. If the `makeAjaxCall(..)` utility isn't under our control, and it happens to call the callback multiple times, or signal both success and error simultaneously, etc, then our generator will go haywire (uncaught errors, unexpected values, etc). Handling and preventing such issues is lots of repetitive manual work, also possibly not portable.
3. Often times we need to do more than one *task* "in parallel" (like two simultaneous Ajax calls, for instance). Since generator `yield` statements are each a single pause point, two or more cannot run at the same time -- they have to run one-at-a-time, in order. So, it's not very clear how to fire off multiple tasks at a single generator `yield` point, without wiring up lots of manual code under the covers.

As you can see, all of these problems are *solvable*, but who really wants to reinvent these solutions every time. We need a more powerful pattern that's designed specifically as a [trustable, reusable solution](http://blog.getify.com/promises-part-3/) for our generator-based async coding.

That pattern? **yielding out promises**, and letting them resume the generator when they fulfill.

Recall above that we did `yield request(..)`, and that the `request(..)` utility didn't have any return value, so it was effectively just `yield undefined`?

Let's adjust that a little bit. Let's change our `request(..)` utility to be promises-based, so that it returns a promise, and thus what we `yield` out **is actually a promise** (and not `undefined`).

```js
function request(url) {
    // Note: returning a promise now!
    return new Promise( function(resolve,reject){
        makeAjaxCall( url, resolve );
    } );
}
```

`request(..)` now constructs a promise that will be resolved when the Ajax call finishes, and we return that promise, so that it can be `yield`ed out. What next?

We'll need a utility that controls our generator's iterator, that will receive those `yield`ed promises and wire them up to resume the generator (via `next(..)`). I'll call this utility `runGenerator(..)` for now:

```js
// run (async) a generator to completion
// Note: simplified approach: no error handling here
function runGenerator(g) {
    var it = g(), ret;

    // asynchronously iterate over generator
    (function iterate(val){
        ret = it.next( val );

        if (!ret.done) {
            // poor man's "is it a promise?" test
            if ("then" in ret.value) {
                // wait on the promise
                ret.value.then( iterate );
            }
            // immediate value: just send right back in
            else {
                // avoid synchronous recursion
                setTimeout( function(){
                    iterate( ret.value );
                }, 0 );
            }
        }
    })();
}
```

Key things to notice:

1. We automatically initialize the generator (creating its `it` iterator), and we asynchronously will run `it` to completion (`done:true`).
2. We look for a promise to be `yield`ed out (aka the return `value` from each `it.next(..)` call). If so, we wait for it to complete by registering `then(..)` on the promise.
3. If any immediate (aka non-promise) value is returned out, we simply send that value back into the generator so it keeps going immediately.

Now, how do we use it?

```js
runGenerator( function *main(){
    var result1 = yield request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = yield request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
} );
```

Bam! Wait... that's the **exact same generator code as earlier?** Yep. Again, this is the power of generators being shown off. The fact that we're now creating promises, `yield`ing them out, and resuming the generator on their completion -- **ALL OF THAT IS "HIDDEN" IMPLEMENTATION DETAIL!** It's not really hidden, it's just separated from the consumption code (our flow control in our generator).

By waiting on the `yield`ed out promise, and then sending its completion value back into `it.next(..)`, the `result1 = yield request(..)` gets the value exactly as it did before.

But now that we're using promises for managing the async part of the generator's code, we solve all the inversion/trust issues from callback-only coding approaches. We get all these solutions to our above issues for "free" by using generators + promises:

1. We now have built-in error handling which is easy to wire up. We didn't show it above in our `runGenerator(..)`, but it's not hard at all to listen for errors from a promise, and wire them to `it.throw(..)` -- then we can use `try..catch` in our generator code to catch and handle errors.
2. We get all the [control/trustability](http://blog.getify.com/promises-part-2/#uninversion) that promises offer. No worries, no fuss.
3. Promises have lots of powerful abstractions on top of them that automatically handle the complexities of multiple "parallel" tasks, etc. For example, `yield Promise.all([ .. ])` would take an array of promises for "parallel" tasks, and `yield` out a single promise (for the generator to handle), which waits on all of the sub-promises to complete (in whichever order) before proceeding. What you'd get back from the `yield` expression (when the promise finishes) is an array of all the sub-promise responses, in order of how they were requested (so it's predictable regardless of completion order).

First, let's explore error handling:

```js
// assume: `makeAjaxCall(..)` now expects an "error-first style" callback (omitted for brevity)
// assume: `runGenerator(..)` now also handles error handling (omitted for brevity)

function request(url) {
    return new Promise( function(resolve,reject){
        // pass an error-first style callback
        makeAjaxCall( url, function(err,text){
            if (err) reject( err );
            else resolve( text );
        } );
    } );
}

runGenerator( function *main(){
    try {
        var result1 = yield request( "http://some.url.1" );
    }
    catch (err) {
        console.log( "Error: " + err );
        return;
    }
    var data = JSON.parse( result1 );

    try {
        var result2 = yield request( "http://some.url.2?id=" + data.id );
    } catch (err) {
        console.log( "Error: " + err );
        return;
    }
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
} );
```

If a promise rejection (or any other kind of error/exception) happens while the URL fetching is happening, the promise rejection will be mapped to a generator error (using the -- not shown -- `it.throw(..)` in `runGenerator(..)`), which will be caught by the `try..catch` statements.

Now, let's see a more complex example that uses promises for managing even more async complexity:

```js
function request(url) {
    return new Promise( function(resolve,reject){
        makeAjaxCall( url, resolve );
    } )
    // do some post-processing on the returned text
    .then( function(text){
        // did we just get a (redirect) URL back?
        if (/^https?:\/\/.+/.test( text )) {
            // make another sub-request to the new URL
            return request( text );
        }
        // otherwise, assume text is what we expected to get back
        else {
            return text;
        }
    } );
}

runGenerator( function *main(){
    var search_terms = yield Promise.all( [
        request( "http://some.url.1" ),
        request( "http://some.url.2" ),
        request( "http://some.url.3" )
    ] );

    var search_results = yield request(
        "http://some.url.4?search=" + search_terms.join( "+" )
    );
    var resp = JSON.parse( search_results );

    console.log( "Search results: " + resp.value );
} );
```

`Promise.all([ .. ])` constructs a promise that's waiting on the three sub-promises, and it's that main promise that's `yield`ed out for the `runGenerator(..)` utility to listen to for generator resumption. The sub-promises can receive a response that looks like another URL to redirect to, and chain off another sub-request promise to the new location. To learn more about promise chaining, [read this article section](http://blog.getify.com/promises-part-5/#the-chains-that-bind-us).

Any kind of capability/complexity that promises can handle with asynchronicity, you can gain the sync-looking code benefits by using generators that `yield` out promises (of promises of promises of ...). **It's the best of both worlds.**

## runGenerator(..): Library Utility

We had to define our own `runGenerator(..)` utility above to enable and smooth out this generator+promise awesomeness. We even omitted (for brevity sake) the full implementation of such a utility, as there's more nuance details related to error-handling to deal with.

But, you don't want to write your own `runGenerator(..)` do you?

I didn't think so.

A variety of promise/async libs provide just such a utility. I won't cover them here, but you can take a look at `Q.spawn(..)`, the `co(..)` lib, etc.

I will however briefly cover my own library's utility: [asynquence's runner(..) plugin](http://github.com/getify/asynquence), as I think it offers some unique capabilities over the others out there. I wrote an [in-depth 2-part blog post series on asynquence](https://davidwalsh.name/asynquence-part-1/) if you're interested in learning more than the brief exploration here.

First off, *asynquence* provides utilities for automatically handling the "error-first style" callbacks from the above snippets:

```js
function request(url) {
    return ASQ( function(done){
        // pass an error-first style callback
        makeAjaxCall( url, done.errfcb );
    } );
}
```

That's **much nicer**, isn't it!?

Next, *asynquence*'s `runner(..)` plugin consumes a generator right in the middle of an *asynquence* sequence (asynchronous series of steps), so you can pass message(s) in from the preceding step, and your generator can pass message(s) out, onto the next step, and all errors automatically propagate as you'd expect:

```js
// first call `getSomeValues()` which produces a sequence/promise,
// then chain off that sequence for more async steps
getSomeValues()

// now use a generator to process the retrieved values
.runner( function*(token){
    // token.messages will be prefilled with any messages
    // from the previous step
    var value1 = token.messages[0];
    var value2 = token.messages[1];
    var value3 = token.messages[2];

    // make all 3 Ajax requests in parallel, wait for
    // all of them to finish (in whatever order)
    // Note: `ASQ().all(..)` is like `Promise.all(..)`
    var msgs = yield ASQ().all(
        request( "http://some.url.1?v=" + value1 ),
        request( "http://some.url.2?v=" + value2 ),
        request( "http://some.url.3?v=" + value3 )
    );

    // send this message onto the next step
    yield (msgs[0] + msgs[1] + msgs[2]);
} )

// now, send the final result of previous generator
// off to another request
.seq( function(msg){
    return request( "http://some.url.4?msg=" + msg );
} )

// now we're finally all done!
.val( function(result){
    console.log( result ); // success, all done!
} )

// or, we had some error!
.or( function(err) {
    console.log( "Error: " + err );
} );
```

The *asynquence* `runner(..)` utility receives (optional) messages to start the generator, which come from the previous step of the sequence, and are accessible in the generator in the `token.messages` array.

Then, similar to what we demonstrated above with the `runGenerator(..)` utility, `runner(..)` listens for either a `yield`ed promise or `yield`ed *asynquence* sequence (in this case, an `ASQ().all(..)` sequence of "parallel" steps), and waits for *it* to complete before resuming the generator.

When the generator finishes, the final value it `yield`s out passes along to the next step in the sequence.

Moreover, if any error happens anywhere in this sequence, even inside the generator, it will bubble out to the single `or(..)` error handler registered.

*asynquence* tries to make mixing and matching promises and generators as dead-simple as it could possibly be. You have the freedom to wire up any generator flows alongside promise-based sequence step flows, as you see fit.

## ES7 async

There is a proposal for the ES7 timeline, which looks fairly likely to be accepted, to create still yet another kind of function: an `async function`, which is like a generator that's automatically wrapped in a utility like `runGenerator(..)` (or *asynquence*'s' `runner(..)`). That way, you can send out promises and the `async function` automatically wires them up to resume itself on completion (no need even for messing around with iterators!).

It will probably look something like this:

```js
async function main() {
    var result1 = await request( "http://some.url.1" );
    var data = JSON.parse( result1 );

    var result2 = await request( "http://some.url.2?id=" + data.id );
    var resp = JSON.parse( result2 );
    console.log( "The value you asked for: " + resp.value );
}

main();
```

As you can see, an `async function` can be called directly (like `main()`), with no need for a wrapper utility like `runGenerator(..)` or `ASQ().runner(..)` to wrap it. Inside, instead of using `yield`, you'll use `await` (another new keyword) that tells the `async function` to wait for the promise to complete before proceeding.

Basically, we'll have most of the capability of library-wrapped generators, but **directly supported by native syntax**.

Cool, huh!?

In the meantime, libraries like *asynquence* give us these runner utilities to make it pretty darn easy to get the most out of our asynchronous generators!

## Summary

Put simply: a generator + `yield`ed promise(s) combines the best of both worlds to get really powerful and elegant sync(-looking) async flow control expression capabilities. With simple wrapper utilities (which many libraries are already providing), we can automatically run our generators to completion, including sane and sync(-looking) error handling!

And in ES7+ land, we'll probably see `async functions` that let us do that stuff even without a library utility (at least for the base cases)!

**The future of async in JavaScript is bright**, and only getting brighter! I gotta wear shades.

But it doesn't end here. There's one last horizon we want to explore:

What if you could tie 2 or more generators together, let them run independently but "in parallel", and let them send messages back and forth as they proceed? That would be some super powerful capability, right!?! This pattern is called "CSP" (communicating sequential processes). We'll explore and unlock the power of CSP in the next article. Keep an eye out!

