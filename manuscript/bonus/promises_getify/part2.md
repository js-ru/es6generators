A> This is a multi-part blog post series on the whys and hows and problems of Promises:
A>
A> * [Part 1: The Sync Problem](#promises-getify-part-1)
A> * [Part 2: The Inversion Problem](#promises-getify-part-2)
A> * [Part 3: The Trust Problem](#promises-getify-part-3)
A> * [Part 4: The Extension Problem](#promises-getify-part-4)
A> * [Part 5: The LEGO Problem](#promises-getify-part-5/)

* * *

# Promises: The Inversion Problem (part 2) {#promises-getify-part-2}

In [Part 1: The Sync Problem](#promises-getify-part-1) of this series, we uncovered JS’s async event-loop **concurrency** model to explain how multiple tasks, when broken up into their constituent steps, can be interleaved so as to seem that they run “at the same time”.

Then we explored why we struggle to express such things in our code, and why our brains are even worse at juggling them.

We’ll now further motivate the search for a better solution to expressing async flow-control by diving into “Inversion of Control”, and then see how Promises bring us toward that solution!

**Note:** This is not an exhaustive tutorial on the Promises API, but rather an overview of why and how Promises as a coding pattern address our concerns. For a more complete look at the mechanism, see [JavaScript Promises: There and back again](http://www.html5rocks.com/en/tutorials/es6/promises/).

### Nested Callbacks

The event-loop model for concurrency has been built into JS from the beginning. And we’ve been writing asynchronous programs that whole time. And until recently, the only common pattern for handling these tasks was the humble callback function.

```js
makeAjaxRequest( url, function(response){
  alert( "Response: " + response );
} );
```

When we have a single async pause in the flow-control of our program, using a callback like this isn’t _too bad_.

However, it’s more common for asynchronous tasks to actually be comprised of multiple steps. For example:

```js
btn.addEventListener( "click", function(evt){
  makeAjaxRequest( url, function(response){
  makeAjaxRequest( anotherURL + "?resp=" + response, function(response2){
  alert( "Response 2: " + response2 );
  } );
  } );
}, false );
```

The most natural way to chain a series of asynchronous steps together using plain callbacks is to nest them together, where step 2 is hard-coded into step 1, and step 3 is hard-coded into step 2, etc.

#### Callback Hell

The more you nest callbacks together, the more you create a nested, heavily indented mess of spaghetti code. Not surprisingly, this type of code is harder to write, harder to understand, and harder to maintain. But the unassisted work it takes to unwind these parts into something more sane often proves more effort than it’s worth.

This type of nesting/indentation is often lovingly called “callback hell”. It’s also sometimes called the “pyramid of doom”, referring to the triangular (pointing rightward) shape of the code that gets more and more obvious the deeper the nesting.

But I would suggest to you that “callback hell” really doesn’t have much to do with nesting or indentation. If you’ve been told that before, don’t believe the person who you heard it from, because they don’t quite understand what’s fully at stake.

### Trust Lost

The real problem with callbacks (whether they’re nested or not) is much deeper than whitespace in your code editor.

Let’s break down what happens with a simple, single callback.

```js
// everything in my program before now

someAsyncThing( function(){
  // everything in my program for later
} );
```

Do you see what that snippet reveals? You’ve essentially split your program into two parts:

1. everything that has happened up until now
2. everything that will happen later

In other words, you’ve wrapped up the second half of your program into a callback function, and deferred it until later.

But that’s not the problem. The problem is what happens between (1) and (2). Ask yourself: who’s in control during that time?

`someAsyncThing(..)` is in control. Do you own and manage `someAsyncThing()`? Sometimes, but many times, no. More importantly, how much do you **trust** `someAsyncThing(..)`?

Trust for what, you ask? Whether you realize it or not, you are implicitly trusting `someAsyncThing(..)` for the following:

1. Don’t call my callback too early
2. Don’t call my callback too late
3. Don’t call my callback too few times
4. Don’t call my callback too many times
5. Make sure to provide my callback with any necessary state/parameters
6. Make sure to notify me if my callback fails in some way

Phew! That’s an awful lot of trust!

Actually, the real problem here is the **Inversion of Control** that’s implied by callbacks.

In the first half of your program, you were in control of how things proceeded. Now, you’ve inverted that control, and `someAsyncThing(..)` is in control of when and if the rest of your program resumes.

**Inversion of Control** implies a lost-trust relationship between your code and someone else’s code.

#### Scare Tactics

What happens when `someAsyncThing(..)` is a method in a third-party library which you don’t own, you don’t control, and you can’t audit? Good luck with that!

Say you have an e-commerce page, and the user is almost through with checkout, but you have one last step to do before charging their card, and it involves notifying a third-party tracking lib. You call their API method, and you provide your callback to them. Most of the time, this works great.

But, on this transaction, there’s some weird bug that neither you nor they have recognized before, and the end result is that the third-party lib calls the callback once per second for 5 seconds before it times out. And guess what? This callback has the “chargeTheCreditCard()” call in it.

Oops, the customer just got charged 5 times. Why? Because you trusted it to only call your callback once.

So, you have egg on your face, and you apologize to the customer and refund their credit card for the 4 extra charges. And then you immediately set out to make sure **THAT** never happens again. What do you do?

You probably invent some sort of state tracking that your callback has access to, where it can flag that it’s already been called once, and ignore any accidental duplicate calls. No matter how profusely the third-party apologizes and promises that their side’s bug was fixed, you don’t trust them anymore, do you?

This may seem like a silly scenario, but it’s a lot more prevalent than you may be aware. The more sophisticated our programs become, and the more we integrate with third-party/external code, the more likely these scenarios will pop up.

#### Duct-tape

Now what? You invented the state tracking mechanism for your callback, and you sleep a little better at night (despite how it made your code a bit uglier). But you’ve actually only addressed one of the **many** items on that trust-list.

Guess what happens when another bug uncovers another moment of lost-trust? More inventing, more ugly code.

More duct-tape. You’re constantly going to be covering up holes in the callback paradigm. No matter how good a developer you are, and no matter how awesome your duct-tape, the fact is: **callbacks are full of holes in your trust wall**.

### The Promised Solution

Some people like running around with duct-tape and inventing patches to the holes in their trust wall.

But at some point, you may ask yourself, is there some other pattern for expressing my async flow control in such a way that it’s not so subject to all this lost-trust?

**Yes!** That solution is Promises.

Before I explain exactly how they work, though, let me explain a bit more about the conceptuals behind them.

#### Fast Food Transaction

You walk into your favorite fast-food restaurant, go up to the counter, and order some nice yummy food. The cashier tells you it’s $7.53, and you hand her the money. What does she give you back?

Well, if you’re lucky, your food is ready. But almost all the time, you get a receipt with an order number on it, right? So, you take a few steps back to join the huddled masses of other calorie-addicts who are impatiently awaiting their food.

Shortly, you hear those magic words: “Order number 317”. That’s your number! You walk up to the counter and exchange your receipt for… your food! Thank goodness, you couldn’t have taken that agonizing wait much longer!

What just happened is a good metaphor for Promises. You went up to the counter to start a transaction, but the transaction couldn’t complete right away. Instead, you were given a _promise_ for a completed transaction (your food!) at a later time. Once your food was ready, you were notified, and you exchanged your promise (receipt) for the thing you wanted in the first place: the food.

In other words, the receipt with the order number was a promise for a future value.

#### Completion Event

Think about calling `someAsyncThing(..)` from above. Wouldn’t it be nicer if, instead of passing it your callback, you could call it and then **subscribe to an event** that would notify you when it was complete (either right away or much later)?

For example, imagine this code:

```js
var listener = someAsyncThing(..);

listener.on( "completion", function(data){
  // keep going now!
} );
```

In fact, wouldn’t in be even nicer if we could also listen for a failure of the `someAsyncThing(..)` to complete?

```js
listener.on( "failure", function(err){
  // Oops, what's plan B?
} );
```

Now, for every function call we make, we could be notified asynchronously if the function completed successfully or if it failed to complete. In other words, each function call would be a _decision point_ in the flow-control of the program.

#### Promise “Events”

**Promises** are how a function call says, “Here’s an event listener to be notified when I complete or fail.”

Here’s a glimpse of how they work:

```js
function someAsyncThing() {
  var p = new Promise( function(resolve,reject){
  // at some later time, call `resolve()` or `reject()`
  } );

  return p;
}

var p = someAsyncThing();

p.then(
  function(){
  // success happened :)
  },
  function(){
  // failure happened :(
  }
);
```

You essentially listen for the `then` event, and then you’re told of success or failure based on which callback gets called.

#### Uninversion

With promises, instead of _inverting control_ by passing a callback to the third party utility, we **retain control** of over the continuation of the program. This is a huge step forward for async flow-control expression in JavaScript!

“**But wait!**“, you say. “I’m still passing in callbacks. What gives!?”

Ahhh, good eye!

Some claim that Promises solve “callback hell” by removing the need for callbacks. **Not true!** In some cases, you even have more callbacks than before. Morever, depending on how your code is written, you might still have nesting of promises inside other promises!

Critically, what promises do is **shift where your callbacks are passed to.**

In essence, if you pass your callbacks to a neutral Promise mechanism that has a well-defined set of guarantees and predictability, you substantially retain the trust that the continuation of your program will be sane and well-behaved.

The standard promises mechanism (that is, both the native Promise in ES6 as well as any promise library that’s [Promises/A+ compliant](http://promisesaplus.com/)) has the following guarantees with respect to this trust:

1. If the promise is resolved (aka, the async function finishes its task), it will **only** be either a success or a failure, not both.
2. Once the promise is resolved, it can never be resolved again (no duplicate calls possible!)
3. If the code that resolves the promise sends a success message, your success callback will receive that message.
4. If an error occurs (either an unexpected JS error or a program-level defined error where the promise is `reject()`‘ed), anywhere within the scope of the promise’s capability, the promise will receive an error notification (aka, failure to complete) along with any error message sent.
5. Whatever the promise’s eventual result value is (success or failure), it will never change once it’s been set, and you’ll always be able to access this message as long as you keep the promise around.

What happens if the “promise” we get back from `someAsyncThing(..)` is not actually a reliable, standard promise? What if we don’t know if we can trust that it’s a real promise?

Easy! As long as the thing you get back is “promise-like” (aka, a “thenable”) in that it has a `then(..)` function on it that can be called to registered both success and failure handlers, you can take your “promise-like” _thing_ and wrap it in a **real promise** that you can trust:

```js
var notSureWhatItIs = someAsyncThing();

var p = Promise.resolve( notSureWhatItIs );

// now we can trust `p`!!
p.then(
  function(){
  // success happened :)
  },
  function(){
  // failure happened :(
  }
);
```

The most important characteristic of promises is that it normalizes into predictable form how we handle the success or failure of any function call, especially if that call may be asynchronous in nature.

And in that normalization, it leaves our program in a position to control and trust how it will proceed, rather than handing that control (via a callback continuation) off to an untrustable third-party.

### Summary

Regardless of what you may have heard, “callback hell” is not really about nested functions and the indentations they create in our code editor.

It’s about **Inversion of Control**, which means that we lose control of the continuation of our program by handing it off to a third-party we’re not in control of and that we cannot trust.

Promises uninvert that paradigm, leaving our program in control as it should be. Instead of passing a callback _to_ a third-party (asynchronous) function, that function returns _back_ a **promise** (or promise-like object), which we can use to listen for completion or failure.

We still use callbacks with promises, but the important part is that standardized promise mechanisms (either built-in or using a compliant library) give us a solid foundation of trust about the sanity of their behavior, so that we don’t have to invent ad hoc solutions to handle these trust concerns.

In [Part 3: The Trust Problem](#promises-getify-part-3/), we will address a very specific part of the promises trust mechanism: the fact that the state of a promise must be reliable and unchangeable.
