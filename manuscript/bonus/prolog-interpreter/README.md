Generators and [backtracking](https://en.wikipedia.org/wiki/Backtracking) can be used to build a simple Prolog interpreter in less than 160 lines of JavaScript. It will tell us several facts about the [Forrester family](http://theboldandthebeautiful.wikia.com/wiki/The_Forrester_family) and even solve the [Einstein’s puzzle](https://en.wikipedia.org/wiki/Zebra_Puzzle).

Prolog is a declarative programming language where the program is a set of relations represented by facts and rules used to infer more facts. Although Prolog was designed for natural language processing it is used in other areas like games, [semantic web](http://www.swi-prolog.org/web/), [theorem proving](http://link.springer.com/article/10.1007%2FBF00297245) or [role-based access](https://gerrit-review.googlesource.com/Documentation/prolog-cookbook.html#_prolog_in_gerrit) to resources. Prolog was used to implement the initial version of the [Erlang](https://en.wikipedia.org/wiki/Erlang_(programming_language)#History) compiler.

The interpreter in this article will run a limited subset of Prolog. The implementation based on ES6 generators will make it possible to query for as much or as few answers to Prolog queries as the client wants.

This implementation uses several ES6 features not yet enabled by default in Chrome (version 36). It is necessary to enable Experimental JavaScript at `chrome://flags/#enable-javascript-harmony`. Firefox (version 31) supports generators as well as sets and maps.

## Prolog program

The Prolog source code consists of two types of clauses — facts and rules.

The **fact** is an [expression that makes a declarative statement about the problem domain](http://www.cs.trincoll.edu/~ram/cpsc352/notes/prolog/factsrules.html). For example the following facts describe a part of the Forrester family.

```
father_child(massimo, ridge).
father_child(eric, thorne).
father_child(thorne, alexandria).

mother_child(stephanie, thorne).
mother_child(stephanie, kristen).
mother_child(stephanie, felicia).
```

We can query those facts asking whether `eric` is a father of `thorne`:

```
father_child(eric, thorne)
```

Or — using variables — ask for all children of stephanie:

```
mother_child(stephanie, X)
```

**Rules** use implication to describe relationship among facts and other rules. The following rules say that each `X` who is a father or mother of `Y` is also a parent of `Y`.

```
parent_child(X, Y) :- father_child(X, Y).
parent_child(X, Y) :- mother_child(X, Y).
```

The following query asks for both parents of `thorne`:

```
parent_child(X, thorne)
```

To describe relationship between siblings we use the conjunction. Two siblings `X` and `Y` must have the same parent `Z`.

```
sibling(X, Y) :- parent_child(Z, X), parent_child(Z, Y).
```

The following query asks for all siblings of `felicia`:

```
sibling(X, felicia)
```

Rules can also be [recursive](http://www.doc.gold.ac.uk/~mas02gw/prolog_tutorial/prologpages/recursion.html) describing complex relations using themselves.

```
ancestor(X, Y) :- parent_child(X, Y).
ancestor(X, Y) :- parent_child(X, Z), ancestor(Z, Y).

ancestor(X, alexandria)
```

## Data types

```
father_child(massimo, ridge).
```

Prolog has only one data type — the term. The simplest term is an *atom*. `father_child`, `massimo` and `ridge` are atoms. Atoms do not have an inherent meaning.

Atoms can be combined to form the *compound terms*. `father_child(massimo, ridge)` is a compound term where `father_child` is called a *functor* and `massimo` and `ridge` are arguments. Atom can be considered a compound term with no arguments.

```
parent_child(X, Y) :- father_child(X, Y).
```

Another type of term is a *variable*. Variables start with an uppercase letter and indicate a placeholder for an actual term.

## Algorithm

The algorithm relies on two methods implemented by the terms:

1. `match` — that checks whether the terms are identical and if so extracts a map of variable bindings. If the terms cannot be unified it returns `null`.
1. `substitute` — that takes variable bindings from `match` and returns a term with all occurrences of these variables substituted with values from the bindings map.

The code below matches two terms:

```
father_child(eric, thorne)
```

and

```
father_child(eric, X)
```

extracting value of the variable `X`.

```js
var knownTerm = new Term('father_child', [
    new Term('eric'), new Term('thorne')
]);

var x = new Variable('X');

var goal = new Term('father_child', [
    new Term('eric'), x
]);

var bindings = goal.match(knownTerm);

print('Bindings object is a Map: ' + bindings);

bindings.forEach(function(value, key) {
    print(key + ' = ' + value);
});

var value = goal.substitute(bindings);
print('Goal with substituted variables: ' + value);
```

The bindings returned by the `match` function are combined using the `mergeBindings` function. This function takes two maps of bindings and returns a combined bindings map if there are no conflicts. If any of the bound variables is present in both bindings maps but the terms they are bound to do not match then `mergeBindings` returns `null`.

The implementation has one predefined term — `true` — that is used to represent facts as rules. These two are equivalent:

```
mother_child(stephanie, thorne).
mother_child(stephanie, thorne) :- true.
```

## Interpreter

```js
function mergeBindings(bindings1, bindings2) {
    if (!bindings1 || !bindings2) {
        return null;
    }
    var conflict = false;
    var bindings = new Map;
    bindings1.forEach(function(value, variable) {
        bindings.set(variable, value);
    });
    bindings2.forEach(function(value, variable) {
        var other = bindings.get(variable);
        if (other) {
            var sub = other.match(value);
            if (!sub) {
                conflict = true;
            } else {
                sub.forEach(function(value, variable) {
                    bindings.set(variable, value);
                });
            }
        } else {
            bindings.set(variable, value);
        }
    });
    if (conflict) {
        return null;
    }
    return bindings;
};
​
function Variable(name) {
    this.name = name;
}
​
Variable.prototype.match = function(other) {
    var bindings = new Map;
    if (this !== other) {
        bindings.set(this, other);
    }
    return bindings;
};
​
Variable.prototype.substitute = function(bindings) {
    var value = bindings.get(this);
    if (value) {
        // if value is a compound term then substitute
        // variables inside it too
        return value.substitute(bindings);
    }
    return this;
};
​
function Term(functor, args) {
    this.functor = functor;
    this.args = args || [];
}
​
function zip(arrays) {
    return arrays[0].map(function(element, index) {
        return arrays.map(function(array) {
            return array[index];
        });
    });
}
​
Term.prototype.match = function(other) {
    if (other instanceof Term) {
        if (this.functor !== other.functor) {
            return null;
        }
        if (this.args.length !== other.args.length) {
            return null;
        }
        return zip([this.args, other.args]).map(function(args) {
            return args[0].match(args[1]);
        }).reduce(mergeBindings, new Map);
    }
    return other.match(this);
};
​
Term.prototype.substitute = function(bindings) {
    return new Term(this.functor, this.args.map(function(arg) {
        return arg.substitute(bindings);
    }));
};
​
Term.prototype.query = function*(database) {
    yield* database.query(this);
};
​
Term.TRUE = new Term('true');
​
Term.TRUE.substitute = function() {
    return this;
};
​
Term.TRUE.query = function*() {
    yield this;
};
​
function Rule(head, body) {
    this.head = head;
    this.body = body;
}
​
function Conjunction(args) {
    this.args = args;
}
​
Conjunction.prototype = Object.create(Term.prototype);
​
Conjunction.prototype.query = function*(database) {
    var self = this;
    function* solutions(index, bindings) {
        var arg = self.args[index];
        if (!arg) {
            yield self.substitute(bindings);
        } else {
            for (var item of database.query(arg.substitute(bindings))) {
                var unified = mergeBindings(arg.match(item), bindings);
                if (unified) {
                    yield* solutions(index + 1, unified);
                }
            }
        }
    }
    yield* solutions(0, new Map);
};
​
Conjunction.prototype.substitute = function(bindings) {
    return new Conjunction(this.args.map(function(arg) {
        return arg.substitute(bindings);
    }));
};
​
function Database(rules) {
    this.rules = rules;
}
​
Database.prototype.query = function*(goal) {
    for (var i = 0, rule; rule = this.rules[i]; i++) {
        var match = rule.head.match(goal);
        if (match) {
            var head = rule.head.substitute(match);
            var body = rule.body.substitute(match);
            for (var item of body.query(this)) {
                yield head.substitute(body.match(item));
            }
        }
    }
};
```

## Einstein’s puzzle

This puzzle is also called the [Zebra puzzle](https://en.wikipedia.org/wiki/Zebra_Puzzle) because one of the puzzle goals is to find the zebra’s owner.

The puzzle is used as a test for the interpreter. It also shows one of the Prolog’s strengths — given a simple description of the problem domain the interpreter can use facts and rules to infer other facts that are not immediately obvious.

First the [helper facts](https://stackoverflow.com/questions/7338225/why-cant-i-get-the-answer-to-the-zebra-puzzle-in-prolog) are defined and then they are used to describe houses. Note how each clue is translated to a Prolog term. This code uses [single underscore variables](https://en.wikipedia.org/wiki/Prolog_syntax_and_semantics#Data_types) to denote anonymous variables that are not relevant and can be bound to anything (wildcards).

1. There are five houses.

```js
exists(A, list(A, _, _, _, _)).
exists(A, list(_, A, _, _, _)).
exists(A, list(_, _, A, _, _)).
exists(A, list(_, _, _, A, _)).
exists(A, list(_, _, _, _, A)).

rightOf(R, L, list(L, R, _, _, _)).
rightOf(R, L, list(_, L, R, _, _)).
rightOf(R, L, list(_, _, L, R, _)).
rightOf(R, L, list(_, _, _, L, R)).

middle(A, list(_, _, A, _, _)).

first(A, list(A, _, _, _, _)).

nextTo(A, B, list(B, A, _, _, _)).
nextTo(A, B, list(_, B, A, _, _)).
nextTo(A, B, list(_, _, B, A, _)).
nextTo(A, B, list(_, _, _, B, A)).
nextTo(A, B, list(A, B, _, _, _)).
nextTo(A, B, list(_, A, B, _, _)).
nextTo(A, B, list(_, _, A, B, _)).
nextTo(A, B, list(_, _, _, A, B)).

puzzle(Houses) :-
```

2. The Englishman lives in the red house. — *each house will be defined as* `house(Color, Owner, Drinks, Smokes, Pet)`

```
exists(house(red, english, _, _, _), Houses),
```

3. The Spaniard owns the dog.

```
exists(house(_, spaniard, _, _, dog), Houses),
```

4. Coffee is drunk in the green house.

```
exists(house(green, _, coffee, _, _), Houses),
```

5. The Ukrainian drinks tea.

```
exists(house(_, ukrainian, tea, _, _), Houses),
```

6. The green house is immediately to the right of the ivory house.

```
rightOf(house(green, _, _, _, _), house(ivory, _, _, _, _), Houses),
```

7. The Old Gold smoker owns snails.

```
exists(house(_, _, _, oldgold, snails), Houses),
```

8. Kools are smoked in the yellow house.

```
exists(house(yellow, _, _, kools, _), Houses),
```

9. Milk is drunk in the middle house.

```
middle(house(_, _, milk, _, _), Houses),
```

10. The Norwegian lives in the first house.

```
first(house(_, norwegian, _, _, _), Houses),
```

11. The man who smokes Chesterfields lives in the house next to the man with the fox.

```
nextTo(house(_, _, _, chesterfield, _), house(_, _, _, _, fox), Houses),
```

12. Kools are smoked in the house next to the house where the horse is kept.

```
nextTo(house(_, _, _, kools, _),house(_, _, _, _, horse), Houses),
```

13. The Lucky Strike smoker drinks orange juice.

```
exists(house(_, _, orangejuice, luckystike, _), Houses),
```

14. The Japanese smokes Parliaments.

```
exists(house(_, japanese, _, parliament, _), Houses),
```

15. The Norwegian lives next to the blue house.

```
nextTo(house(_, norwegian, _, _, _), house(blue, _, _, _, _), Houses),
```

16. Now, who drinks water? Who owns the zebra?

```
exists(house(_, _, water, _, _), Houses),
exists(house(_, _, _, _, zebra), Houses).
```

The solution — finding who drinks water and who owns zebra can be obtained by solving the `puzzle(Houses)` query and then asking for the two specific people.


```
solution(WaterDrinker, ZebraOwner) :-
    puzzle(Houses),
    exists(house(_, WaterDrinker, water, _, _), Houses),
    exists(house(_, ZebraOwner, _, _, zebra), Houses).
    
solution(WaterDrinker, ZebraOwner)
```

Actually as a part of finding the water drinker and zebra owner the algorithm has to correctly place all the information. We can see the complete solution by asking for `puzzle(Houses)`:

```
puzzle(Houses)
```

## Parser

The following code implements a lexer and a parser for the interpreter.

* The lexer converts the input source to a generator of tokens.
* Facts are parsed as rules with the body set to true.
* Variables with the same name within one rule use one variable object (with an exception of the anonymous variable).
* Atoms are terms without the arguments.


```js
function *lexer(text) {
    var tokenRegexp = /[A-Za-z_]+|:\-|[()\.,]/g;
    var match;
    while ((match = tokenRegexp.exec(text)) !== null) {
        yield match[0];
    }
}
​
function parser(tokens) {
    var current, done, scope;
    function next() {
        var next = tokens.next();
        current = next.value;
        done = next.done;
    }
    function parseAtom() {
        var name = current;
        if (!/^[A-Za-z_]+$/.test(name)) {
            throw new SyntaxError('Bad atom name: ' + name);
        }
        next();
        return name;
    }
    function parseTerm() {
        if (current === '(') {
            next(); // eat (
            var args = [];
            while (current !== ')') {
                args.push(parseTerm());
                if (current !== ',' && current !== ')') {
                    throw new SyntaxError('Expected , or ) in term but got ' + current);
                }
                if (current === ',') {
                    next(); // eat ,
                }
            }
            next(); // eat )
            return new Conjunction(args);
        }
        var functor = parseAtom();
        if (/^[A-Z_][A-Za-z_]*$/.test(functor)) {
            if (functor === '_') {
                return new Variable('_');
            }
            // variable X in the same scope should point to the same object
            var variable = scope[functor];
            if (!variable) {
                variable = scope[functor] = new Variable(functor);
            }
            return variable;
        }
        if (current !== '(') {
            return new Term(functor);
        }
        next(); // eat (
        var args = [];
        while (current !== ')') {
            args.push(parseTerm());
            if (current !== ',' && current !== ')') {
                throw new SyntaxError('Expected , or ) in term but got ' + current);
            }
            if (current === ',') {
                next(); // eat ,
            }
        }
        next(); // eat )
        return new Term(functor, args);
    }
    function parseRule() {
        var head = parseTerm();
        if (current === '.') {
            next(); // eat .
            return new Rule(head, Term.TRUE);
        }
        if (current !== ':-') {
            throw new SyntaxError('Expected :- in rule but got ' + current);
        }
        next(); // eat :-
        var args = [];
        while (current !== '.') {
            args.push(parseTerm());
            if (current !== ',' && current !== '.') {
                throw new SyntaxError('Expected , or ) in term but got ' + current);
            }
            if (current === ',') {
                next(); // eat ,
            }
        }
        next(); // eat .
        var body;
        if (args.length === 1) {
            // body is a regular Term
            body = args[0];
        } else {
            // body is a conjunction of all terms
            body = new Conjunction(args);
        }
        return new Rule(head, body);
    }
    next(); // start the tokens iterator
    return {
        parseRules: function() {
            var rules = [];
            while (!done) {
                // each rule gets its own scope for variables
                scope = { };
                rules.push(parseRule());
            }
            return rules;
        },
        parseTerm: function() {
            scope = { };
            return parseTerm();
        }
    };
}
```

## Connecting parser and interpreter

The following code parses a rules text and then constructs a Database object. The `query` method returns a generator that iterates over all terms that match the given goal.

```js
var rulesText = 'mother_child(stephanie, thorne).' +
    'mother_child(stephanie, kristen).' +
    'mother_child(stephanie, felicia).';
​
var rules = parser(lexer(rulesText)).parseRules();
​
var db = new Database(rules);
​
var goalText = 'mother_child(X, kristen)';
​
var goal = parser(lexer(goalText)).parseTerm();
​
var x = goal.args[0]; // variable X
​
for (var item of db.query(goal)) {
    print(item);
    print('value of X = ' + goal.match(item).get(x));
}
```

Using generators have also one interesting aspect — each iteration of `for-of` loop does just enough work to compute only one (next) solution.

The actual code used in this article wraps the code above in a [dynamically constructed](https://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string#answer-10372280) Web Worker to avoid blocking the user interface.

## Playground

The code below is a solution to the [alternative version of the Einstein’s puzzle](http://mathforum.org/library/drmath/view/60971.html). This editor’s content is persisted in localStorage so that any modifications will be preserved. It can be used to experiment with Prolog and with this interpreter.

```
exists(A, list(A, _, _, _, _)).
exists(A, list(_, A, _, _, _)).
exists(A, list(_, _, A, _, _)).
exists(A, list(_, _, _, A, _)).
exists(A, list(_, _, _, _, A)).

rightOf(R, L, list(L, R, _, _, _)).
rightOf(R, L, list(_, L, R, _, _)).
rightOf(R, L, list(_, _, L, R, _)).
rightOf(R, L, list(_, _, _, L, R)).

middle(A, list(_, _, A, _, _)).

first(A, list(A, _, _, _, _)).

nextTo(A, B, list(B, A, _, _, _)).
nextTo(A, B, list(_, B, A, _, _)).
nextTo(A, B, list(_, _, B, A, _)).
nextTo(A, B, list(_, _, _, B, A)).
nextTo(A, B, list(A, B, _, _, _)).
nextTo(A, B, list(_, A, B, _, _)).
nextTo(A, B, list(_, _, A, B, _)).
nextTo(A, B, list(_, _, _, A, B)).

puzzle(Houses) :-
  exists(house(red, british, _, _, _), Houses),
  exists(house(_, swedish, _, _, dog), Houses),
  exists(house(green, _, coffee, _, _), Houses),
  exists(house(_, danish, tea, _, _), Houses),
  rightOf(house(white, _, _, _, _), house(green, _, _, _, _), Houses),
  exists(house(_, _, _, pall_mall, bird), Houses),
  exists(house(yellow, _, _, dunhill, _), Houses),
  middle(house(_, _, milk, _, _), Houses),
  first(house(_, norwegian, _, _, _), Houses),
  nextTo(house(_, _, _, blend, _), house(_, _, _, _, cat), Houses),
  nextTo(house(_, _, _, dunhill, _),house(_, _, _, _, horse), Houses),
  exists(house(_, _, beer, bluemaster, _), Houses),
  exists(house(_, german, _, prince, _), Houses),
  nextTo(house(_, norwegian, _, _, _), house(blue, _, _, _, _), Houses),
  nextTo(house(_, _, _, blend, _), house(_, _, water_, _, _), Houses).

solution(FishOwner) :-
  puzzle(Houses),
  exists(house(_, FishOwner, _, _, fish), Houses).

solution(FishOwner)
```