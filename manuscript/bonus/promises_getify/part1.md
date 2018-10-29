# Promises: The Sync Problem (part 1) {#promises-getify-part-1}

A> This is a multi-part blog post series on the whys and hows and problems of Promises:
A>
A> * [Part 1: The Sync Problem](#promises-getify-part-1)
A> * [Part 2: The Inversion Problem](#promises-getify-part-2)
A> * [Part 3: The Trust Problem](#promises-getify-part-3)
A> * [Part 4: The Extension Problem](#promises-getify-part-4)
A> * [Part 5: The LEGO Problem](#promises-getify-part-5/)

In this post, I will explain what motivates the need for a better way (aka, Promises!) to express async flow-control in our programs.

## Async

You’ve almost certainly heard the term “async” used to describe JavaScript functionality. What exactly does that mean, though?

When you fire off an Ajax request, for instance, you usually provide a _callback_ function to be called once the request completes and you have a response. But have you ever stopped to wonder how your callback gets called in relation to other code that may need to run? What if two callbacks tried to run at the same time? How would the JS engine handle that?

To understand what async really is, you need to understand one fact about the JS engine: **it is single-threaded**. That means that at any given moment, only _one piece_ of JS code can be being executed. But what do I mean by “one piece”? Generally speaking, each single function is an indivisible piece or chunk of code. When the JS engine starts executing a function (such as a callback), it _runs-to-completion_, meaning it finishes that function before it moves on to the next piece of code.

In other words, the JS engine is like an amusement ride at a theme park, with a long line of people wanting to take a turn, but where only one person can ride at a time. He lets one person off, the next person gets on. Whenever you want to ride the ride, you get in line, at the back of the line, and you patiently wait your turn. Luckily, most riders on this ride only take a few brief moments to complete the ride, so the line moves pretty quickly.

The technical term for this _line_ you wait in is called the “event loop”. It spins as quickly as it can, and if anyone’s in line, it lets the JS engine execute that piece of code, then it moves onto the next, or it patiently waits for someone else to get in line.

### Concurrency

If you only thought of your program in terms of “one task at a time”, that would seem quite slow and limiting, right?

If you click a button to submit a form request, and your mouse freezes and you can’t scroll the page, and that lasts for several seconds before the request finishes, that feels like a pretty terrible user-experience, right?

That’s why real-world programs are often comprised of a lot more going on than just one task. But how?

You have to think of each piece of code as running in an extremely short _slice of time_, usually well less than 1 millisecond in length. In the time it takes you to blink your eyes, the JS engine could process dozens or hundreds of these little snippets.

But not all of these snippets are related to the same macro-task. For instance, after you click “submit” on a form, you also can click on a navigation item, or scroll down the page, etc. Each high-level task that you perform is often sliced up into many tiny steps, and these steps can be processed very quickly by the engine.

For example:

**Task A**

* step 1
* step 2
* step 3
* step 4

**Task B**

* step 1
* step 2

It is true that the single thread of the JS engine cannot do step **A:1** at the exact same time as step **B:1**. But, **Task B** does not need to wait for **Task A** to fully complete, because the engine can switch back and forth between the individual steps very quickly, perhaps in an order like this:

* **A:1**
* **B:1**
* **A:2**
* **B:2** (Task B complete!)
* **A:3**
* **A:4** (Task A complete!)

So, the fact that **Task A** and **Task B** can run “at the same time”, with their individual steps being interleaved together, is called _concurrency_ — in other words, **Task A** and **Task B** run concurrent to each other.

It’s easy to get _concurrency_ confused with _parallelism_. In a truly parallel system, you would have multiple threads running, and one thread would run **Task A** while a separate thread ran **Task B**. That means, essentially, that the running of **A:1** in no way blocks **B:1** from running.

It’s like there’s two separate amusement park rides, with two separate lines of impatient riders. Neither ride or line waits on the other.

The JS _event loop_ is a simple model for _concurrency_. It simply allows each “event” (that is, generally, a function callback execution) to be added onto the end of the line, on a first-come-first-served basis. When its turn is ready, the callback is processed individually. Whatever larger macro-task sequence that callback step is part of (**Task A** or **Task B**) has its steps interleaved with steps from other tasks, etc.

## Synchronous Async

One of the subtle but troublesome parts of writing asynchronous code in JS (especially using callbacks) is that it produces a mismatch between how we look at and reason about the code (the flow-control) and how the engine actually processes it.

For example:

```js
makeAjaxRequest( url, function(response){
 alert( "Response: " + response );
} );
```

How would you describe the flow-control steps of this program?

Most developers would say something like:

1. Fire off an Ajax request.
2. When it’s complete, popup the response.

But that’s not quite accurate compared to how the JS engine will handle it.

The problem is, our brains (by and large) operate in a synchronous fashion. In that above description, we implied with “When…” that we could somehow “block” on the waiting of the Ajax request, and then move on to the next part of the program (the callback with the `alert(..)` in it).

JS doesn’t block between steps 1 and 2 (unless you commit the unpardonable sin of making a synchronous Ajax request — so don’t!!). A more accurate way of describing that code as JS would handle it is:

1. Fire off an Ajax request.
2. Register a callback for when it completes later.
3. (.. do some other stuff ..)
4. At some point in the future, exclaim “Oh, I just got a response back!”. Now, go find and run that registered callback.

It may seem like not such a big deal, but it can be a big problem that the way we think about and write our code seems to skip over the nuance of step 3.

Source code is for developers, not for computers. The computer only cares about 1’s and 0’s. And there’s nearly an infinite number of programs that could produce the same sequence of 1’s and 0’s. We write source code so that we can understand and reason about our code and our tasks in a meaningful and accurate way.

Because async is hard for our brains to handle, we strive to find patterns to write our code in a more synchronously looking way and hide the implementation detail that parts of it may pause and asynchronously resume later.

For example, wouldn’t this code be easier for you to reason about, if it could work like we need it to without blocking (it doesn’t!):

```js
response = makeAjaxRequest( url );

alert( "Response: " + response );
```

If we could write code like that, we could hide/abstract the potentially async nature of `makeAjaxRequest(..)` behind the scenes, and in our main source code, not worry about that detail.

In other words, we can make “async” just be a pesky implementation detail, and keep that stuff where it belongs: buried beneath our real code.

## Summary

We haven’t solved the problem yet. But at least we know what the problem is: that expressing async code in an async way is hard, and even harder for our brains to manage.

What we need is a way to express synchronous-looking code which is easy enough for our brains to reason about, and hide the async bits as much as possible.

The goal should be code that looks synchronous, and whether it behaves sync or async, we don’t have to care.

In [Part 2: The Inversion Problem](#promises-getify-part-2), I will tackle “callback hell” to explain what it’s all about (maybe not what you assume!), and we’ll see how Promises will clean it up.