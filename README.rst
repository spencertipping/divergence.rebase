=================
Divergence Rebase
=================

Rebase is a Divergence module that provides operator overloading and syntactic macros in pure JavaScript. There are a few relatively unobtrusive limitations (see Caveats below), but it is able
to run on its own source code successfully.

I'm writing a guide that covers both Rebase and Divergence usage; see the `Divergence guide <http://github.com/spencertipping/divergence-guide>`_.

String interpolation
====================

Any string inside a rebased function (see below) can have expressions inside of it, and those expressions will be interpolated just like they are in Ruby. For example, this string::

  'foo is #{3 + 5}'

will be translated to ``('foo is ' + (3 + 5) + '')``. You can use any expression inside a ``#{}`` block as long as it contains no ``}`` characters -- the parser is uninsightful about handling
those and will chop off the interpolated expression at the first closing brace it sees.

Naturally this happens only inside rebased functions; this code illustrates that::

  (function () {return 'foo is #{3 + 5}'}) ()                 // => 'foo is #{3 + 5}'
  d.rebase (function () {return 'foo is #{3 + 5}'}) ()        // => 'foo is 8'

You can use overloaded operators and other syntactic macros in the expressions and they will be handled correctly::

  d.rebase (function () {return 'foo is #{(x >$> x + 1) (5)}'}) ()    // => 'foo is 6'

Note that even though it seems valid, you can't use an interpolated string as a hash key, because string interpolation rewrites the literal into a parenthesized expression::

  d.rebase (function () {return {'foo is #{3 + 5}': 'bar', bif: 'baz'}})      // => SyntaxError: invalid object key: ('foo is ' + (3 + 5) + '')

Rebase isn't context-aware enough to detect or fix this. A reasonable workaround, however, is to fold over ``d.init``, merging objects::

  d.rebase (function () {
    return d.init ('foo is #{3 + 5}'.maps_to('bar'), {bif: 'baz'});
  }) ();                                                                      // => {'foo is 8':'bar', bif:'baz'}

Operator overloading
====================

Consider this function::

  (function (x) {return x << 4}) ([1, 2, 3])            // Nothing useful

To add an operator, you just set a member of the prototype::

  Array.prototype['<<'] = function () {this.push.apply (this, arguments); return this};
  d.rebase (function (x) {return x << 4}) ([1, 2, 3])   // => [1, 2, 3, 4]

You can also create new operators using 'sandwich identifiers', which are identifiers that, when placed between two binary operators, will become part of those operators. For example::

  d.rebase.sandwiches['foo'] = true;
  d.rebase (function (x) {return x >foo> y})    // => x['>foo>'](y)

You can overload these operators in exactly the same way.

You can also rebase expressions, just like ``eval``::

  d.rebase ('[1, 2, 3] << 4')   // => [1, 2, 3, 4]

However, these expressions don't close over surrounding variables. There are two ways to work around this. One is to use ``eval`` explicitly::

  eval (d.rebase.local ('[1, 2, 3] << 4'))    // [1, 2, 3, 4]

The other way is to preload a function::

  d.rebase (function (x, y, z) { ... x y z ... }).fn (x, y, z);

Note that you can't say it this way::

  d.rebase ((function (x, y, z) { ... }).fn (x, y, z))

because then you'd be rebasing the proxy function that ``fn()`` creates. Instead, you have to rebase the original and proxy the result with the preloaded arguments. (See the `Divergence
guide <http://github.com/spencertipping/divergence-guide>`_ if this usage of ``fn()`` seems unfamiliar.)

Code can be protected from alteration as well. You do this by using the ``literal`` keyword::

  d.rebase (function () {
    [1, 2, 3] << 4;
    var f = x >$> x + 1;
    var y = literal (3 << 4);
  });

In this case, the expression ``3 << 4`` will remain untransformed; that is, no macros will be run on it and no operator overloading will be performed. This can be useful for optimization.

By default, Rebase won't transform the strings that Divergence promotes into functions. If you do want to use operator overloading and other macros inside these strings, however, you can::

  [1, 2, 3].map ('((x, y) >$> x + y).fn($0)')         // Nothing useful

  d.rebase.enable_inline_macro();
  [1, 2, 3].map ('((x, y) >$> x + y).fn($0)')         // Returns an array of functions

Preserving lexical closure
--------------------------

JavaScript doesn't support dynamic scoping very uniformly, but ``eval`` lets you hack around that. If you want to keep the scope chain of a rebased function intact, you can use
``d.rebase.local`` and ``eval`` to do that::

  (function () {
    var x = 5;
    var f = eval (d.rebase.local (function () {return y >$> x + y})) ();
    f(4)        // => 9
  }) ();

Caveats
-------

1. Method calls are a lot slower than operators, so Rebase will slow your code down by quite a bit.
2. Postfix increment/decrement expressions followed by a binary operator, such as ``x++ + 5``, are not parsed correctly (they fail a sanity check).
3. Statement-mode function definitions aren't allowed -- you have to use ``var f = function () ...`` instead of ``function f () ...``
4. **Rebased functions aren't closures.** They're re-evaluated at the global scope, which means that any closed-over variables will have to be passed in explicitly. However, all sub-functions
   inside a rebased function will close over variables within the rebased function's scope.
5. SpiderMonkey JS does aggressive constant-folding, including replacing certain arithmetic expressions with ``NaN`` if it can determine that the types won't work out. In particular, this
   includes bit-shifting, multiplying, dividing, etc. by a non-numeric literal. So for reliable operation, you should use variables instead of literals to avoid these issues.
6. Nullary ``return`` doesn't get parsed correctly. You always need to return something, even if it's just ``undefined``.
7. ``do {} while ()`` loops aren't handled. Handling these makes ``while`` context-sensitive, and Rebase's parser is purely precedence-oriented.

Rebase uses a series of functions installed on the prototypes of all standard types in order to mimic the default behavior. Sometimes these functions will not quite behave the same way due to
autoboxing; if you find such a case, let me know.

Syntactic macros
================

Rebase also lets you transform the syntax tree in arbitrary ways. Any function in the ``d.rebase.macros`` array will be run on each syntax node. This lets you do a number of useful things,
including inserting debugging information, tracing things (see the `Divergence debugging module <http://github.com/spencertipping/divergence-debug>`_), or coming up with new meanings for
existing operators.

The value passed into a macro will have one of three types:

1. A syntax tree node
2. A string representing some token of input -- in this case it will be a boxed ``String`` object and have ``line`` and ``character`` attributes indicating the position from which it was read
3. ``undefined``, meaning that there isn't anything there

Syntax tree nodes each have a parent, an operator called ``op`` (whose arity, precedence, etc. can be checked by the functions and hashes inside d.rebase), and an array of operands called
``xs``. Note that the syntax tree constructed by Rebase is not complete or necessarily even correct; its only purpose is to provide some minor degree of abstraction above a string. (A new
feature is that each token generated by the lexer knows its position; these are stored in the ``line`` and ``character`` attributes on the string.)

Tokens are represented exactly as typed. This includes nullary keywords such as break and continue, strings, regular expressions, numbers, booleans, etc.

Undefined is encountered in situations where the JavaScript grammar isn't really expression-oriented. This includes statement processing -- for example, if you type ``;;;`` in a function, then
there are two empty statements. Those statements must exist in some form in an expression-oriented parse tree, but they don't actually get rendered into the output. So the values representing
those statements would be ``undefined``.
