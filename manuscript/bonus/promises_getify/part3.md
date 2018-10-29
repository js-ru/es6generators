A> This is a multi-part blog post series on the whys and hows and problems of Promises:
A>
A> * [Part 1: The Sync Problem](#promises-getify-part-1)
A> * [Part 2: The Inversion Problem](#promises-getify-part-2)
A> * [Part 3: The Trust Problem](#promises-getify-part-3)
A> * [Part 4: The Extension Problem](#promises-getify-part-4)
A> * [Part 5: The LEGO Problem](#promises-getify-part-5/)

* * *

# Promises: The Trust Problem (part 3) {#promises-getify-part-3}

If you are still needing to get up to speed on what Promises are or how they are useful, check out [Part 1: The Sync Problem](#promises-getify-part-1) and [Part 2: The Inversion Problem](#promises-getify-part-2) of this series.

## Promise State == Trust

Previously, we asserted an important list of guarantees about how promises work, which are _the foundation_ on which we can base our trust in the promise mechanism as a solution to inversion of control.

This guarantee set comes directly from the [Promises/A+ Specification](http://promisesaplus.com/). Any native implementation or conforming polyfill or library must pass an exhaustive and rigorous set of tests designed to ensure those requirements are true and reliable.

**Note:** I have one such conformant implementation, [Native Promises Only](http://github.com/getify/native-promise-only), which is a very strictly-adhering polyfill (no more, no less) for the coming ES6 standardized Promises. Since it’s a polyfill (at only 1.2k minzipped!), it’s safe to drop into your project right now, and start using Promises as the native API intends. Older browsers will use the polyfill, and new browsers will skip it and use the native implementation. That’s a pretty solid win wrangling your async code.

Especially with promises, trust is essential, because without trust, you’re left in the same boat as with just normal callbacks. You must code defensively around any part of your program that invokes a third-party in an asynchronous way (via a callback). You have to solve yourself all the issues of tracking the state of the program and making sure the third-party doesn’t misbehave.

_Can_ you do that yourself without trusting promises? Of course. But odds are: you’re not going to be perfect at it, you’re cluttering up your main code base with lots of extra cruft, and you’re creating a future maintenance hazard.

**Promises are designed to standardize and centralize that logic.** You can use a conformant promise system without any loss-of-trust that _it will behave_ according to the guarantees of the specification for the Promise mechanism.

## Trustworthy?

That guarantee-trust contract sounds great… in theory. But is it possible to actually have such a mechanism in JavaScript?

### Trust Myths

Let’s first dispell a couple of myths about “trust” with JS code, as _I mean it here presently_:

1. Our discussion here has **nothing to do** with “privacy” or “security” in the cryptographic/encryption sense.
2. It also has **nothing to do** with the fact that JS code is viewable by any end-user with `view-source`.
3. It has **nothing to do** with the fact that a hacker can compromise your server to send malicious code, or corrupt/hijack the browser-server connection with a man-in-the-middle attack to do the same, or even use XSS vulnerabilities to inject malicious code into the page during run-time.
4. Moreover, it has **nothing to do** with the fact that malicious code, once in the page, could in theory hijack JavaScript run-time facilities (like built-in mechanisms on the `Object.prototype` or `Function.prototype`) to try and mess with your program’s functioning.
5. Similarly, it has **nothing to do** with the fact that ignorant code can accidentally do the same things by accidentally overwriting important standard JS capabilities in unsafe/non-standard ways.
6. It furthermore has **nothing to do** with the fact that if you rely on third-party software being included in your page, _their servers, connections, and code_ are all also subject to all of the above vulnerabilities.

I could go on, but I think you get the point. We’re narrowing our discussion here with an important assumption: how will your program behave **when all the code and host environment it’s running in are in the intended, non-compromised state?**

That’s not to say that some of what we can do with Promises (especially native built-in ones via ES6) doesn’t _help_ alleviate **some** of the above concerns. It’s just that those concerns are at a much higher level of abstraction — trusting JS in the page/application itself — and that’s a question that goes far beyond coding APIs and patterns, and will therefore be left to subject matter experts.

### Trusting In A Promise State

Let’s consider this scenario:

```js
var myPromise = {
 state: {
  status: 1,
  value: "Hello World"
 },
 then: function(success,failure) {
  // implement something like a thenable's behavior
 }
};
```

I can construct an object like that, and pass it around all day long, and **say** that I’m using promises. In fact, I can go to the extra work to even make sure this _thing_ passes the full [Promises/A+ Test Suite](https://github.com/promises-aplus/promises-tests).

**BUT AM I ACTUALLY USING PROMISES??**

How you answer that question is of a far deeper importance than you may realize. There appear to be many within the developer community who would say, “yes”.

I would emphatically say, “no”.

Why? If it passes the promises test suite, it’s a promise, right? That is, it’s going to behave according to the specification for all the possible scenarios we can put it in, right?

**No.**

The spirit of promises, more so even than the specification wording itself, is **trust**.

It’s a trust that a promise is a wrapper for a piece of state (which predictably will transition from “pending” to either — not both — “resolved” or “rejected”) along with a completion-value (success message or error message). It’s a trust that once a promise is in a “resolved” or “rejected” state, along with that message, **it cannot and will not change**. It’s a trust that completed promises are immutable.

But there’s something even deeper in the spirit of promises, as they were originally conceived and designed years ago, which is hard to spot by looking plainly at the specification wording: **the ONLY capability to advance a promise’s state (from “pending” to “resolved” or “rejected”) and to set its message-value exists at the original promise creation**.

Earlier versions of the specification (and indeed early experiements in various libraries, including jQuery) split out this resolution/rejection capability into its own object, and called it a **Deferred**.

Think of it like an object pairing: at creation, we make both a _promise_ and a _deferred_ which can resolve that promise.

Importantly, the two can be split up, because it’s critical for separation of concerns that one piece of code be able to resolve/reject a promise, while another piece of code is able only to be notified of this and respond accordingly.

Later versions of the specification simplified this notion of promises by removing a visible _deferred_ object, and instead simply exposing the `resolve()` and `reject()` triggers that belong to the underneath _deferred_.

```js
var p = new Promise( function(resolve,reject){
 // I have `resolve()` and `reject()` from the
 // hidden `deferred`, and I **alone** control
 // the state of the promise.
} );

// now, I can pass around `p` freely, and it can't
// be changed by anyone else but the creator.
```

Look at this `myPromise` object from earlier. What do you notice about its state?

```js
var myPromise = {
 state: {
  status: 1,
  value: "Hello World"
 },
 then: function(success,failure) {
  // implement something like a thenable's behavior
 }
};
```

If you pass around `myPromise`, and either malicious or accidental code decides to change the `myPromise.state.status` or `myPromise.state.value` properties, **haven’t we completely opened up a HUGE backdoor that erases the entirety of trust that we could have placed in our promise’s behavior?**

Of course we have! Publicly exposing the state to mutation, either as shown or via mutator methods, is like not having a real promise at all. Because now that promise’s guarantees about behavior are completely and totally **untrustable**.

If you were handed such an object back from a third-party method, you wouldn’t trust it, would you? More importantly, if you had to take that “promise-but-not-a-promise” _thing_ and pass it around to **other** third-parties, you wouldn’t trust that **only the original creator** could change it, would you?

Of course not. That would be supremely naive.

You see, using promises is based on trust. And that trust is based on the state of the promise being protected from outside influence, **except only by the creator**. Note that I’m not saying the state _has_ to be private (though that’s certainly a better idea!), only that it has to be immutable from the outside world’s perspective.

Without trust in the state of a promise being immutable except by its creator, **nearly all of the benefit of promises is lost.**

## Trust Misplaced?

“No big deal, duh!”, you think. Of course promise state has to be trustable. That much is obvious, right?

Sigh. Here’s where things get murky. Here’s the inconvenient truth.

Most of the promise polyfills that purport to bring `Promise` to all older JS environments (and even some of the higher-level promise abstraction libraries), expose the state publicly in a **mutable** way.

Ouch. Let that sink in…

“Wait, why am I using promises again?” Yeah, I’ve had that thought, too.

For the record, my ES6 Promise polyfill [“Native Promise Only”](http://github.com/getify/native-promise-only) **does NOT expose mutable state publicly.** To my knowledge, it’s the _only_ direct polyfill which protects the critical promise state from outside alteration.

Why? Because I care deeply about not just the _specification_ of Promises but the **spirit of Promises**.

### Tradeoffs

But why on earth would all these highly respected Promise polyfills and libraries forgo such an important part of what makes promises, promises?

Because natively in JavaScript, there are some limitations which a built-in mechanism (like we’re getting with ES6) does not suffer.

Briefly, the upcoming ES6 specification says that `Promise` is a “class” (ugh, I **hate** this concept in JS — read [my YDKJS book](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/README.md) to know why!), and that moreover, as a “class”, it should be “sub-classable”.

In other words, you should be able to, in ES6 terms, create a `class CustomPromise extends Promise { .. }` sub-class, upon which you augment the capabilities of built-in promises as necessary.

For example, let’s say you needed a custom promise that could hold more than one message. Theoretically at least, doing so would just require you to extend the built-in `Promise` “class” and extend away!

To be entirely transparent with my biases, I actually think `Promise` sub-classing is somewhat of moot farce or red herring. As hard as I’ve tried to come up with good situations where promise sub-classes will be a useful thing, I can’t really think of (m)any.

Moreover, the implementations of these sub-classes are probably going to be rather awkward, if they are intending to retain any sense of conformance to the parent [Promises/A+ Test Suite](https://github.com/promises-aplus/promises-tests).

Bottom line, **I’m not in any way excited by promise sub-classing.**

### The how!?

Without getting into too much JS detail (seriously, go read [my “YDKJS: this & Object Prototypes” book](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/README.md)!), expressing `Promise` as a “class” that can be `extend`ed requires you to put its instance methods (namely `then(..)` and `catch(..)`) onto the `Promise.prototype` object.

But when you do that, and you make `then(..)` and `catch(..)` shared methods which all `Promise` instances will delegate to (aka, “inherit” — ugh, bad term!), then these methods can **only access public properties on each instance via their `this` binding reference**.

In other words, using only JS, it’s basically impossible, using closure or any other tricks, to create totally private, protectable “state” for a promise instance, **if the promise has to be sub-classable**.

I know a bunch of you are going to think right now about various tricks you think you’ve seen where people try in Frankenstein ways to create a mixture between closured private state and `this` public inheritance.

I could write a whole book on why that doesn’t work (oh wait, I did!), but I am just going to simply assert here: regardless of what you’ve seen or heard, using only what we have accessible to us in ES5 and below (which is all a Promise polyfill can use!), you cannot create private state **and** have _effective_ sub-classability.

[Read this thread](https://github.com/getify/native-promise-only/issues/2) for more explanation and code.

These two concepts are mutually exclusive in ES5 and below. Well, practically speaking, anyway.

### Promises Weakened

As of ES6, another feature we’re getting is the **WeakMap**. Briefly, without too much detail, a `WeakMap` instance can use actual object references as keys, and thus can associate data with an object instance without actually storing that data _on_ the object.

Eureka! That’s what we need, right? We need a hidden `WeakMap` instance that our shared `then(..)` and `catch(..)` methods can access, where they can take whatever their `this` binding reference is, and look-up the associated protected-state for that object reference. The privileged `Promise` methods can access this internal state, but the outside world cannot.

Well, actually, things are not so rosy:

1. `WeakMap` is basically impossible to implement in a practical, performance-acceptable way, in pure JS. The polyfill for `WeakMap`, if you can call it that, would be deeply flawed (see below).
2. Even if we have `WeakMap` in ES5 and below, it still doesn’t solve the sub-classing problem completely, because you would have to hide that `WeakMap` instance somewhere that only your `Promise` polyfill methods could access, but simultaneously make it so another sub-class of `Promise` could access it. Read [this thread](https://github.com/getify/native-promise-only/issues/2) for more information.

Let’s assume (a giant assumption!) for a moment we could somehow solve (2) — we can’t, but let’s pretend. What would a polyfill for `WeakMap` look like?

Something like this (very stripped down for illustration purposes):

```js
var WeakMap = function(){
 var objs = [], data = [];

 function findObj(obj) {
  for (var i=0; i<objs.length; i++) {
  if (objs[i] === obj) return i;
  }

  // not found, add it onto the end
  objs.push( obj );
  data.push( undefined );

  return i;
 }

 function __set(key,value) {
  var idx = findObj( key );
  data[idx] = value;
 }

 function __get(key) {
  var idx = findObj( key );
  return data[idx];
 }

 return {
  "set": __set,
  "get": __get
 };
};

var myMap = new WeakMap();
var myObj = {};

myMap.set( myObj, "foo" );

myObj.foo; // undefined

myMap.get( myObj ); // "foo"
```

OK, so the basic idea is we just keep two parallel arrays (`objs`, `data`), where the association is purely numerical (same index === related). In the first array, we store object references. In the second array, we store the data.

Cool, huh?

Until you see the performance. Take a look at `findObj(..)`. It has to loop through the entire array of references to find the matching one, each time. The more references you get, the worse the performance.

But that’s not even the worst part. `WeakMap` is called “Weak” because of garbage-collection behavior. In our crappy polyfill for `WeakMap`, it would store a reference to each object, which means that even if the main program has discarded all references to the object, that object wouldn’t be garbage collected. But the real `WeakMap` holds these references _weakly_, so that you don’t have to remove the entry from the `WeakMap` instance to get it to be eligible for garbage collection.

Yeah, `WeakMap` is only a false hope. It doesn’t solve our problem in ES6, and it makes things much worse in ES5 and below.

### To Protect State or To Sub-class?

…that is the question!

I truly wish I could create a faithful polyfill for `Promise` for ES5 and below. Really, I do.

But a choice has to be made, and one way or the other, a divergence is going to occur. **Either the polyfill is going to lose the ability to sub-class, or it’s going to lose the ability to be trusted as a promise.**

So what should we do?

## Summary

It would appear the other promise polyfills have chosen to retain sub-classing, at the expense of ~~their mortal souls~~ immutable state.

I have chosen to abandon sub-classing so that **[my polyfill’s promises](http://github.com/getify/native-promise-only) can actually be trusted**.

As I asserted earlier, I think promise sub-classing will only ever prove, at least in the broad acceptance sense, as a flourish — a nice looking thing which has little-to-no practical value. As such, I will not sacrifice the trustability of promises on the altar of “spec compliance” as it relates to sub-classing.

Clearly, others will feel differently on this topic. But I just want you to ask yourself: a promise that cannot be trusted is good for exactly what? What code will it really save you? What code will it make better?

The problems with the existing ecosystem of Promise polyfills and libraries goes deeper than just this debate of immutable state vs. sub-classing. In [Part 4: The Extension Problem](#promises-getify-part-4), I’m going to address flaws in many of the current polyfills and libraries with respect to “the future”™.
