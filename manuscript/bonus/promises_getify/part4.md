# Promises: The Extension Problem (part 4) {#promises-getify-part-4}

A> This is a multi-part blog post series on the whys and hows and problems of Promises:
A>
A> * [Part 1: The Sync Problem](#promises-getify-part-1)
A> * [Part 2: The Inversion Problem](#promises-getify-part-2)
A> * [Part 3: The Trust Problem](#promises-getify-part-3)
A> * [Part 4: The Extension Problem](#promises-getify-part-4)
A> * [Part 5: The LEGO Problem](#promises-getify-part-5/)

By now, I hope you’ve read [Part 1: The Sync Problem](#promises-getify-part-1), [Part 2: The Inversion Problem](#promises-getify-part-2) and [Part 3: The Trust Problem](#promises-getify-part-3) of this series. I assume from here on you fully understand what Promises are all about and why it’s so important to discuss them to this level of detail.

## Don’t ~~Anger~~ Extend The Natives!

Back in 2005, the [Prototype.js](http://prototypejs.org/) framework was one of the earliest libraries to pioneer the idea of extending built in `.prototype`‘s of JavaScript’s native objects. The idea was that we could extend the existing capabilities by just dropping extra methods on top of them (and in some cases, wrapping existing methods).

If you take a brief survey of the last nearly-decade of JS programming since then, even just a quick naive [google search](https://www.google.com/#q=extending+javascript+prototypes+danger), you’ll see that there’s been quite a backlash over this idea. And for good reason!

The vast majority of developers will now tell you, either: “never extend natives”, or “only extend them for the purposes of polyfilling/prollyfilling”. The latter means, only extend once the future implementation of that name is already specified (or pretty darn likely) and you’re just back-filling compliant behavior into older environments.

To _Prototype_‘s credit, they no longer do that kind of stuff. They took a really bad rap, and they long since have seen the error of those ways. They deserve more credit than they get for cleaning up their act (and the native `.prototype`s).

### Array Push

Imagine this really-old scenario (which actually happened to me): Way back in the Netscape 3/4 and IE4 days, the early landscape of JS was much less awesome than it is today. Among many other notable gaps, arrays did not have a `push(..)` method to add elements onto the end of them.

So, someone could (and did, to me!) come along and add code like this:

```js
// Netscape 4 doesn't have Array.push
Array.prototype.push = function(elem) {
  this[this.length - 1] = elem;
};
```

Might seem reasonable at first glance. Then you realize a few problems.

1. That needs an `if`-guard around it, _just in case_ some crazy JavaScript committee comes along later and defines a built-in `push(..)` method (they did!), which we’d want to make sure we used.
2. We have to be careful that we’ve now broken `for..in` loops on arrays, since our `push(..)` will be an enumerable member that will now show up in the loop. Of course, you should never have used `for..in` loops on arrays anyway, but that’s another story.

There’s a bigger problem, related to (1). Not just do we need an `if`-guard like:

```js
if (!Array.prototype.push) {
  // make our own
}
```

… but we also have to ask ourselves, what if a built-in one comes along someday that is incompatible with ours? What if the new one behaves differently, accepts different numbers or types or orders of parameters?

If we have code relying on our old, custom implementation of `push(..)`, and we simply transparently start using the new implementation, our code will break. If instead insist on overwriting the new built-in `push(..)`, what if some **other library** is used on the page that expects the built-in standardized `push(..)`?

That’s exactly what happened to me one time. I was tasked at a job with adding a widget I’d built to a customer’s really old site, and my widget relied on jQuery. My widget worked great on all sorts of other sites, but on this particular site, it broke, and broke hard. I spent days trying to figure out why.

Eventually, I discovered that exact snippet above, sans the `if`-guard. Notice a problem with that?

It only accepts a single parameter for `push(..)`. jQuery expects to be able to call `.push( el1, el2, ... )`, and it wasn’t working correctly.

Oops.

But guess what happened when I removed that old code (didn’t need to keep it because noone cared about Netscape 4 anymore!)? It broke their site. Why? I still don’t know exactly why. I think they were accidentally relying on extra parameters not getting pushed.

But the point is, I faced a real-world consequence of someone extending the built-in natives in a potentially-unsafe-for-the-future sort of way.

I’m not the only one. Countless thousands or millions of developers have seen first-hand how such things can occur. Most (but not all!) of us now agree that you have to be **very careful** when, if not downright averse to, extending built-in JS natives. And when you do so, you better not pick names for those extensions which are even remotely likely to be collided with in a later version of the language.

**At least, this caution applies if you plan to be around to support that code.** If not, you can just leave that land-mine for some poor, unsuspecting soul like me! :/

## Promise Extensions

What does all that old-grampa whining and finger-waving have to do with the modern hotness of Promises?

Because those who are making `Promise` “polyfills” seem to have forgotten or discarded all of that old wisdom. They’ve started adding extras directly onto `Promise` and `Promise.prototype`.

Do I really need to explain why this is a “future” bad idea (there’s a pun there you may have missed, because promises were once called “futures” in the DOM world)?

### Blue In The Face

We could argue this fact until we’re out of breath, and it still won’t change the facts. If you extend the natives, you’re being future-hostile, even if you think you’re doing a really good job of it.

Moreover, the more general a name you pick to extend a native with, the more likely you are to _eff_ someone over later.

Let’s look at [Bluebird](https://github.com/petkaantonov/bluebird) library for a moment, since it’s one of the most popular `Promise` polyfill/library options out there right now. It’s extremely fast ([micro-optimized to internal VM characteristics](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers)), but it’s also fairly large compared to other promise libs.

But speed and size aren’t my concern right now. What I care about is that it chose to drop itself on top of the `Promise` namespace. Even if it does so in a polyfill-safe sort of way, which it doesn’t, it’s the fact that it adds lots of extras onto this native that really, really bothers me.

For example, [Bluebird adds `Promise.method<wbr>(..)`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisemethodfunction-fn---function):

```js
function someAsyncNonPromiseFunc() {
  // ...
}

var wrappedFn = Promise.method( someAsyncNonPromiseFunc );

var p = wrappedFn(..);

p.then(..)..;
```

Looks harmless, right? Sure. But what if someday the spec wants to add `Promise.method(..)` as some helper. And what if it varies in some large or tiny/subtle way from how Bluebird has done it?

You’re looking at an `Array.prototype.push(..)` all over again.

And Bluebird adds **[lots of stuff](https://github.com/petkaantonov/bluebird/blob/master/API.md)** to the `Promise` native. So there’s lots of chances that in the future there’s some conflict.

**Ugh.** I hope I never have fix someone’s busted Promise extension code. But odds are, I probably will.

### Future Constrained

But that’s not even the worst of it. What if Bluebird is so damn popular, and there’s so much real-world code out on the web relying on all those extensions, that some day the TC39 committee is forced to **avoid** extending the official spec in some way (and find some work-around), or maybe they’re forced to **not fix some bug**, all because if they do so, they’d break “too many sites” using these non-standard extensions?

You see, here’s the real danger to extending the natives: you put your current self in the shoes of the future TC39 members, and flip them off, saying, “good luck dealing with all that!” Odds are, you’re long gone. But generations of JavaScripter’s are left with sub-optimal mechanisms because of your poor choices.

Don’t believe me? It’s happened countless times already. You know why the JS standard has been unable to fix the `typeof null === "object"` bug for 19 years of JS history? Because there’s too much code relying on the broken behavior. If they “fixed” the bug, they’d “break” other bug-workaround code.

**I really don’t want to see this happen with `Promise`s.** Please, stop defining Promise polyfill/libraries that extend the natives. _Please_.

## Wrapper Abstractions

I think we need to see more true-to-spec-and-only-that polyfills, like my [“Native Promise Only”](http://github.com/getify/native-promise-only). We need good, solid, performance-optimized, but narrowly spec-compliant polyfills.

In particular, we need them so that people who want to make promise extensions can do so with wrappers. Shouldn’t we make it super easy to grab a `Promise` polyfill and then create your own `SuperAwesomePromise` wrapper on top of it.

There’s plenty of good ones, like [Q](https://github.com/kriskowal/q) and [when](https://github.com/cujojs/when).

I also wrote one, called [asynquence](http://github.com/getify/asynquence) (async + sequence).

Mine is designed to hide the promises, because IMO they’re a too-low-level API, and instead provide you with a simpler abstraction layer that uses those concepts but hides the ugly details.

For example, compare these two snippets.

**Native Promises:**

```js
function delay(n) {
  return new Promise( function(resolve,reject){
    setTimeout( resolve, n );
  } );
}

function request(url) {
  return new Promise( function(resolve,reject){
    ajax( url, function(err,res){
    if (err) reject( err );
    else resolve( res );
    } );
  } );
}

delay( 100 )
.then( function(){
  return request( "some/url" );
} )
.then(
  success,
  error
);
```

**asynquence:**

```js
function delay(n) {
  return ASQ( function(done){
    setTimeout( done, n );
  } );
}

function request(url) {
  return ASQ( function(done){
    ajax( url, done.errfcb );
  } );
}

delay( 100 )
.val( "some/url" )
.seq( request )
.then( success )
.or( error );
```

Hopefully you can see just in that simple example how _asynquence_ is designed to reduce the friction to using promises to express your complex async flow-control. It creates promises for you under the covers, it automatically chains them together, and it provides short-hand syntax for common composition patterns.

Obviously, I think _asynquence_ is pretty amazing. I think you should [check out](https://github.com/getify/asynquence#tldr-by-example) some of the examples, and [look at the contrib plugins](https://github.com/getify/asynquence/blob/master/contrib/README.md) which extend it even further.

There’s a ton of both simple/helpful capabilities (sugar) as well as some incredibly powerful stuff (like [promises+generators](https://github.com/getify/asynquence/blob/master/contrib/README.md#runner-plugin) and even CSP-style co-routine handling). And the entire package of asynquence plus the optional plugins **is only 3.5k minzipped**. That’s quite a bit of power in a tiny package.

But if _asynquence_ is not your flavor of promises, by all means, [find one](http://promisesaplus.com/implementations) that is. Pick a polyfill (like mine: [“Native Promise Only”](http://github.com/getify/native-promise-only)) or pick a good, well-known abstraction library.

But please don’t pick one that extends the native `Promise` directly. That’s bad for our future selves. Seriously.

## Summary

Promises are amazing and they’re going to revolutionize the way a lot of JS developers write and maintain async flow-control in their programs.

ES6 bringing native `Promises` is a huge win for the language. To hasten that win for everyone, many of us are creating promise polyfills and promise abstraction libraries.

But don’t let the hype and excitement of promises confuse you or distract you from one undeniable fact: **extending built-in natives is a dangerous and risky game**, not just for the library author but for all those who choose to use their library.

Be responsible. Practice safe promise extension. We’ll all thank you for it in the future.