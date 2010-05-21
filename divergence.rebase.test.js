// Divergence Rebase unit tests | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// Divergence core library | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

var d = (function () {
  var c = {}, d = function () {return d[d.default_action].apply (this, arguments)};
  d.init = function (o) {for (var i = 1, l = arguments.length, $_; $_ = arguments[i], i < l; ++i) if ($_.call && $_.call.apply) $_.call (o);
                                                                                                  else                          for (var k in $_) $_.hasOwnProperty (k) && (o[k] = $_[k]); return o};
  d.init (d, {inline_macros:  [],            id: function    (x) {return x},
                functionals:  [],           arr: function    (o) {return Array.prototype.slice.call (o)},
      functional_extensions:  {},           map: function (o, f) {var x = {}; d.keys (o).each (function (k) {d.init (x, f (k, o[k]) || {})}); return x},
             default_action: 'init',       keys: function    (o) {var xs = []; for (var k in o) o.hasOwnProperty (k) && xs.push (k); return xs},
                                      functions: function     () {var as = d.arr (arguments); return d.functionals.each (function (p) {d.init.apply (this, [p].concat (as))}), d},
                                   macro_expand: function    (s) {return d.inline_macros.fold (function (s, m) {return m(s)}, s)},
                                          alias: function (s, f) {d.aliases[s] = f.fn(); return d},
                                          macro: function (r, f) {d.inline_macros.push (r.maps_to (f)); c = {}; return d},
                                          trace: function    (x) {d.tracer && d.tracer ([x].concat (d.arr (arguments)).join (', ')); return x}});

  d (String.prototype, {maps_to: function (v) {var result = {}; result[this] = v; return result},
                         lookup: function  () {return '$0.split(".").fold("$0[$1]", $1)'.fn(this)},
                          alias: function (f) {return d.alias (this, f)},
                           fail: function  () {throw new Error (this.toString())},
                             fn: function  () {var s = this.toString(), f = c[s] || (c[s] = eval ('(function(){return ' + d.macro_expand(s) + '})')); return f.fn.apply (f, arguments)}});

  d (RegExp.prototype, {maps_to: function (f) {var s = this; return function (x) {return x.replace (s, f)}},
                          macro: function (f) {return d.macro (this, f)},
                             fn: function  () {var f = this.exec.bind (this); return f.fn.apply (f, arguments)}});

  d (Array.prototype, {flat_map: function (f) {var xs = [], f = f.fn(); this.each (function (x) {xs.push.apply (xs, f(x))}); return xs},
                        sort_by: function (f) {return this.sort ('$0($1) < $0($2)'.fn (f.fn()))},
                           each: function (f) {f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]); return this},
                           grep: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) f (this[i]) && xs.push (this[i]); return xs},
                           fold: function (f) {var f = f.fn(), xl = arguments.length, x = xl > 1 ? arguments[1] : this[0];
                                               for (var i = 2, l = xl + this.length; i < l; ++i) x = f (x, i < xl ? arguments[i] : this[i - xl]); return x},
                            map: function (f) {var xs = [], f = f.fn(); for (var i = 0, l = this.length; i < l; ++i) xs.push (f (this[i])); return xs},
                             fn: function  () {var xs = this, f = function () {return xs.map ('$1.fn().apply($_,$0)'.fn (arguments))}; return f.fn.apply (f, arguments)}});

  d (Function.prototype, {fn: function () {var f = this, xs = d.arr (arguments); return xs.length ? function () {return f.apply (this, xs.concat (d.arr (arguments)))} : f}});
  d  (Boolean.prototype, {fn: function () {return this.valueOf () ? d.id.fn.apply (d.fn, arguments) : (1).fn ()}});
  d   (Number.prototype, {fn: function () {var x = this, f = function () {return arguments[x]}; return f.fn.apply (f, arguments)}});

               /^\./ .macro ('(arguments[0] || this).');
                /@_/g.macro ('Array.prototype.slice.call(arguments)');
               /\$_/g.macro ('this');
           /\$(\d+)/g.macro ('"arguments[" + arguments[1] + "]"'.fn());
            /@(\w+)/g.macro ('"this." + $1'.fn());

  /\{\|([\w,\s]+)\|/g.macro ('"(function(" + $1 + "){return "'.fn()); /\|\}/g.macro ('})');
              /\{\</g.macro ('(function(){return ');                  /\>\}/g.macro ('})');

  (d.functionals = [Array, Number, Boolean, Function, String, RegExp].map ('.prototype')).push (d.functional_extensions);

  d.functions ({
      compose:  function (g) {var f = this.fn(); g = g.fn(); return function () {return f (g.apply (this, arguments))}},
 flat_compose:  function (g) {var f = this.fn(); g = g.fn(); return function () {return f.apply (this, g.apply (this, arguments))}},
        curry:  function (n) {var f = this.fn(); return n > 1 ? function () {var as = d.arr(arguments); return function () {return f.curry (n - 1).apply (this, as.concat (d.arr (arguments)))}} : f},
        proxy:  function (g) {var f = this.fn(); return g ? function () {return f.apply.apply (f, g.fn() (this, arguments))} : function () {return f.apply (this, arguments)}},
         bind:  function (x) {var f = this.fn(); return d.init (function () {return f.apply (x, arguments)}, {binding: x, original: f})},
         type:  function  () {var f = function () {}, c = this.fn(); f = f.ctor.apply (f, arguments); return function () {return c.apply (new f(), arguments)}},
         ctor:  function  () {var f = this.fn(), g = function () {f.apply (this, arguments)}; d.init.apply (this, [g.prototype].concat (d.arr (arguments))); return g},
         tail: '[$_.fn(), arguments]'.fn(),
          cps:  function (c) {var cc = [this.fn(), [c = (c || d.id).fn().proxy()]]; while (cc[0] !== c) cc = cc[0].fn().apply (this, cc[1]); return c.apply (this, cc[1])}});

  return d}) ();

// Divergence Rebase module | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// Rebase is a Divergence module that takes operator invocations inside functions and rewrites them to be method invocations. Naturally, new meaning can be associated with these constructs; this
// is done by writing methods for them. For example, invocation of the '+' operator is translated into a call to the '+' method. Operator precedence is respected and follows the normal JavaScript
// rules.

// Certain constructs cannot be changed. These include assignment variants such as '+='; such variants are always expanded to their full forms (e.g. a += b becomes a = a + b, which becomes a =
// a['+'](b)). Others include the behavior of 'new', dot-lookups, indexed lookups, function calls, and statement-mode constructs such as 'if', 'for', etc. You can write macros that transform
// these things, but they will have strange limitations and might not behave as expected.

// Since JavaScript is dynamically typed, it isn't possible to know in advance whether an operator overloading replacement will impact a primitive value. This is one reason for the limitations
// described above. The other thing to realize is that those operators need to get replaced for standard things too -- so Number.prototype, String.prototype, and anything else that depends on
// standard operators will have a bunch of replacement functions that delegate to those operators.

// One more thing of importance. Some identifiers are treated specially and sandwiched between operators to form longer operators. They're defined in d.rebase.sandwiches. If an identifier appears
// as a key there (e.g. 'foo'), then it will be sandwiched between binary operators, resulting in the translation of things like 'a + foo + b' as 'a['+foo+'](b)'. This means that you can't use
// 'foo' normally anymore, so use this feature carefully.

(function () {
  var set            = '.fold({< $0[$1] = true, $0 >}, {})'.fn(),            last = '$0[$0.length - 1]'.fn(),  qw = '.split(/\\s+/)'.fn(),
        r = d.rebase =   function () {return r.init.apply (this, arguments)},   $ = null,                       s = '$0 === undefined ? "" : $0.toString()'.fn();

  d.init (r, {precedence: {'function':1, '[!':1, '.':1, '(!':1, 'new':2, 'u++':3, 'u--':3, '++':3, '--':3, 'typeof':3, 'u~':3, 'u!':3, 'u+':3, 'u-':3, '*':4, '/':4, '%':4,
                           '+':5, '-':5, '<<':6, '>>':6, '>>>':6, '<':7, '>':7, '<=':7, '>=':7, 'instanceof':7, 'in':7, '==':8, '!=':8, '===':8, '!==':8, '&':9, '^':10, '|':11, '&&':12,
                           '||':13, '?':14, '=':15, '+=':15, '-=':15, '*=':15, '/=':15, '%=':15, '&=':15, '|=':15, '^=':15, '<<=':15, '>>=':15, '>>>=':15, 'case':16, ':':17, ',':18, 'var':19,
                           'if':19, 'while':19, 'for':19, 'do':19, 'switch':19, 'return':19, 'throw':19, 'delete':19, 'export':19, 'import':19, 'try':19, 'catch':19, 'finally':19, 'void':19,
                           'with':19, 'else':19, '?:':20, ';':21, '{':22, '(':22, '[':22},

                   unary: set(qw('u++ u-- ++ -- u+ u- u! u~ new typeof var case try finally throw return case else delete void import export ( [ { ?:')),
               syntactic: set(qw('case var if while for do switch return throw delete export import try catch finally void with else function new typeof in instanceof')),
                   ident: set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_'.split ('')),                  punct: set('+-*/%&|^!~=<>?:;.,'.split ('')),
                   right: set(qw('= += -= *= /= %= &= ^= |= <<= >>= >>>= u~ u! new typeof u+ u- u++ u-- ++ --')),            openers: {'(':')', '[':']', '{':'}', '?':':'},
     implicit_assignment: set(qw('++ -- u++ u--')),                                                                       sandwiches: set(qw('$ $$ $$$ _ __ ___ _$ _$$ __$')),
                 literal: set(qw('= ++ -- u++ u-- (! [! . ?: , ? ( { [ === !== ; : && ||')),                            sandwich_ops: set(qw('+ - * / % ^ | & << >> >>> < >')),
           prefix_binary: set(qw('if function catch for switch with')),                                                      closers: {')':'(', ']':'[', '}':'{', ':':'?:'},
            translations: {'u+':'+', 'u-':'-', 'u~':'~', 'u!':'!', 'u--':'--', 'u++':'++'},                                 arity_of: '$0.unary[$1] ? 1 : $1 === "?" ? 3 : 2'.fn(r),
           lvalue_assign: set(qw('+= -= *= /= %= ^= |= &= <<= >>= >>>=')),                                            should_convert: '! ($0.literal[$1] || $0.syntactic[$1])'.fn(r),

                    init: '$0.deparse($0.transform($0.parse($1.toString())))'.fn(r),

//   Deparsing.
//   This is certainly the easiest part. All we have to do is follow some straightforward rules about how operators and such get serialized. Luckily this is all encapsulated into the toString
//   logic of the syntax tree.

                 deparse: 'eval($0.trace ? $0.trace ($1.toString()) : $1.toString())'.fn(r),

//   Tree transformation.
//   The goal here is to transform the tree in logical form before serializing it to a final function. The way I've chosen to go about this is to use a macro table and deep-map over the syntax
//   tree. Each node gets inspected, and mapping functions can modify nodes by returning alternative values. To save space and time, I'm having macros replace structures halfway destructively
//   rather than using a pure functional approach.

               transform: function (t) {if (t && t.op === '(!' && t.xs[0] === 'literal') return t.xs[1];
                                        var mapped = r.macros.fold ('$1($0) || $0', t);
                                        mapped && mapped.xs && (mapped.xs = mapped.xs.map ('$1 && $1.op ? $0($1) : $1'.fn (r.transform)));
                                        return mapped},

//   Lexing.
//   The lexer is for the most part straightforward. The only tricky bit is regular expression parsing, which requires the lexer to contextualize operators and operands. I've implemented this
//   logic with a expect_re flag that indicates whether the last token processed was an operator (if so, then we're expecting an operand and the next / delineates a regular expression).

                   parse: function (s) {var i = 0, $_, l = s.length, token = '', expect_re = true, escaped = false, t = new r.syntax(null, '('), c = s.charAt.bind (s), openers = [],
                                            row = 0, col = 0;
                          while (i < l && ($_ = c(i))) {
          col += token.length;
          escaped = token = '';
               if                   (' \n\r\t'.indexOf ($_) > -1)                                                                        ++i, ++col, row += $_ === '\n', col *= $_ !== '\n';
          else if                  ('([{?:}])'.indexOf ($_) > -1)                                                                        expect_re = '([{?:'.indexOf (token = $_) > -1, ++i;
          else if    ($_ === '/' && c(i + 1) === '*' && (i += 2))  while                  (c(++i) !== '/' || c(i - 1) !== '*' || ! ++i);
          else if                ($_ === '/' && c(i + 1) === '/')  while                        (($_ = c(++i)) !== '\n' && $_ !== '\r');
          else if ($_ === '/' &&    expect_re &&  (token = '/'))  {while          (($_ = c(++i)) !== '/' || escaped || ! (token += $_))  expect_re = ! (token += $_), escaped = ! escaped && $_ === '\\';
                                                                   while                                         (r.ident[$_ = c(++i)])  token += $_}
          else if ($_ === '"' && ! (expect_re = ! (token = '"')))  while (($_ = c(++i)) !== '"' || escaped || ! ++i || ! (token += $_))  token += $_, escaped = ! escaped && $_ === '\\';
          else if ($_ === "'" && ! (expect_re = ! (token = "'")))  while (($_ = c(++i)) !== "'" || escaped || ! ++i || ! (token += $_))  token += $_, escaped = ! escaped && $_ === '\\';
          else if     (expect_re && r.punct[$_] && (token = 'u'))  while               (r.punct[$_ = c(i)] && r.precedence[token + $_])  token += $_, ++i;
          else if                                   (r.punct[$_])  while               (r.punct[$_ = c(i)] && r.precedence[token + $_])  expect_re = !! (token += $_), ++i;
          else                                                     while                                           (r.ident[$_ = c(i)])  expect_re = !! r.precedence[token += $_], ++i;

          if (! token) continue;
          token.row = row, token.col = col;

               if          (t.is_value() && '[('.indexOf (token) > -1)  openers.push (t = t.push_op (token + '!').graft (token));
          else if (($_ = r.closers[token]) && last(openers).op === $_)  t = openers.pop().parent;
          else if                                      (token === '?')  openers.push (t = t.push_op (token).graft ('?:'));
          else if                                   (r.openers[token])  openers.push (t = t.graft (token));
          else if                                (r.precedence[token])  t = t.push_op (token);
          else                                                          t.push_value (token);
                          }
                          return t.top()},

//   Incremental parsing.
//   As tokens are read from the lexer they are written into a parse tree. Unlike a traditional grammar with productions, this parse tree works in terms of operators and values. Each element in
//   the text is considered to have a certain precedence and to comprise part of an expression. This leads to a weird model and a much more general grammar than JavaScript's, but this is
//   acceptable because we know that by the time we see the code it will be valid.

//   The mechanics of this parser are fairly simple. We build a tree incrementally and include explicit nodes for parentheses (the role of these nodes will become apparent). Starting with the
//   root node, which has no particular identity, we add expressions and operators to this tree. The rules for this are:

//     | 1. When we add an expression to a tree, it is just added to the operand list. This will throw an error if there are too many operands.
//     | 2. When we add an operator to a tree, we check the precedence. If the new operator binds first, then it is added as a child, given a value, and returned. Otherwise we add it to the
//          parent.

                  syntax: '@parent = $0, @op = $1, @xs = $2 || [], $_'.ctor ({
                           is_value: '@xs.length >= $0.arity_of(@op)'.fn(r),
                         push_value: '! @is_value() ? (@xs.push($0), $0) : ("The token " + $0 + " is one too many for the tree " + @toString() + ".").fail()'.fn(),
                          with_node: '$0 && ($0.parent = $_), @push_value($0), $_'.fn(),
                            push_op: '$0.precedence[$1] - !! $0.right[$1] < $0.precedence[@op] ? @graft($1) : @hand_to_parent($1)'.fn(r),
                              graft: '@push_value(@is_value() ? new $0.syntax($_, $1).with_node(@xs.pop()) : new $0.syntax($_, $1))'.fn(r),
                     hand_to_parent: '@parent ? @parent.push_op($0) : "Syntax trees should have a minimal-precedence container".fail()'.fn(),
                                top: '@parent ? @parent.top() : $_'.fn(),
                           toString:  function () {return '([{'.indexOf(this.op) > -1 ? this.op + s(this.xs[0]) + r.openers[this.op] :
                                                                     this.op ===  '?' ? s(this.xs[0]) + ' ? ' + s(this.xs[1].xs[0]) + ' : ' + s(this.xs[2]) :
                                                 this.op === '(!' || this.op === '[!' ? s(this.xs[0]) + s(this.xs[1]) :
                                                       r.implicit_assignment[this.op] ? '(' + (this.op.charAt(0) === 'u' ? this.op.substring(1) + s(this.xs[0]) : s(this.xs[0]) + this.op) + ')' :
                                                                     r.unary[this.op] ? (r.translations[this.op] || this.op) + ' ' + s(this.xs[0]) :
                                                             r.prefix_binary[this.op] ? this.op + ' ' + s(this.xs[0]) + ' ' + s(this.xs[1]) :
                                                                                        s(this.xs[0]) + ' ' + this.op + ' ' + s(this.xs[1])}}),

//   Macro support.
//   Macros are just functions from syntax to syntax. They should behave as the identity if they don't apply to something.

                  macros: [

//     Assignment expansion.
//     Since the left-hand side of +=, -=, etc. must be an lvalue, we can't say something like x['+='](y) and expect anything useful. So instead of overloading the operator, we just replace it with
//     the longhand x = x + y, and let the '+' operator get replaced by the method call.

          function (e) {return r.lvalue_assign[e.op] ? new r.syntax(null, "=", [e.xs[0], new r.syntax(null, e.op.substring(0, e.op.length - 1), e.xs)]) : e},

//     Identifier sandwiching.
//     Certain identifiers can be sandwiched into binary operators as if they were part of the operator name. Most binary operators are candidates for sandwiching, and several identifiers are
//     included by default (see the sandwiches hash above). This could be optimized by using in-place rewriting, but using sandwich operators is not terribly common.

          function (e) {return r.sandwich_ops[e.op] ?
            e.xs[1] && e.xs[1].op && r.sandwich_ops[e.xs[1].op] && r.sandwiches[e.xs[1].xs[0]] ? new r.syntax(e.parent, e.op + e.xs[1].xs[0] + e.xs[1].op, [e.xs[0], e.xs[1].xs[1]]) :
            e.xs[0] && e.xs[0].op && r.sandwich_ops[e.xs[0].op] && r.sandwiches[e.xs[0].xs[1]] ? new r.syntax(e.parent, e.xs[0].op + e.xs[0].xs[1] + e.op, [e.xs[0].xs[0], e.xs[1]]) :
            e : e},

//     Function notation.
//     To alleviate some of the notational overhead of JavaScript's function definitions, I'm using the operator >$> for this purpose. > takes a low precedence, but it's a good idea to
//     parenthesize each side just in case. You can use this operator without parentheses or with (though for multiple parameters you need them):

//       | x >$> x + 1             // valid
//       | (x) >$> x + 1           // valid
//       | (x, y) >$> x + 1        // valid
//       | x, y >$> x + 1          // parses as x, (y >$> x + 1)

          function (e) {return e.op === '>$>' ? new r.syntax(e.parent, 'function').with_node (e.xs[0].op === '(' ? e.xs[0] : new r.syntax (null, '(', [e.xs[0]])).
                                                                                   with_node (new r.syntax (null, '{').with_node (new r.syntax (null, 'return').with_node (e.xs[1]))) : e},

//     Operator overloading.
//     Once we're done with all of the preprocessing we can actually replace the operators with method calls. I'm cheating just a bit here; normally you would encase the operation inside a [ node
//     after wrapping it as a string. However, I'm being lazy and making the excuse that maybe later on you want to detect proper method calls from generated ones; so the right-hand side of the
//     [! will not be what you expect; rather, it will be a single string containing the text [">$$>"] (or some other operator).

          function (e) {return r.should_convert (e.op) ?
            new r.syntax(e.parent, "(!").with_node(new r.syntax(null, "[!", [e.xs[0], '["' + e.op + '"]'])).with_node(new r.syntax(null, '(', [e.xs[1]])) : e}]});

//   Operator compatibility.
//   We want to make sure that the default behavior of all normal operators is preserved. While we're at it we can give them typable names and form combinatory versions as well.

  var translate = '$0[$1] || $1'.fn(r.translations);
  d.operators = {binary: {transforms: {'$0': '"$_" + $0 + "$0"', '$0 + "_fn"': '"{|t, x| t.apply($_,@_)" + $0 + "x.apply($_,@_)|}.fn($_.fn(), $0.fn())"'},
                           operators: {plus:'+', minus:'-', times:'*', over:'/', modulo:'%', lt:'<', gt:'>', le:'<=', ge:'>=', eq:'==', ne:'!=', req:'===', rne:'!==', and:'&&', or:'||', xor:'^',
                                       bitand:'&', bitor:'|', then:',', lshift: '<<', rshift: '>>', rushift: '>>>'}},
                  unary: {transforms: {'$0': '$0($1) + "$_"'.fn(translate), '$0 + "_fn"': '"{|f| " + $0($1) + "f.fn.apply($_,@_)|}.fn($_.fn())"'.fn(translate)},
                           operators: {not:'!', notnot:'!!', complement:'~', negative:'u-', positive:'u+'}}};

  d.map (d.operators, function (_, os) {
    d.map (os.transforms, function (nt, vt) {d.functions (d.map (os.operators, function (n, v) {return d.init (nt.fn()(v).maps_to (vt.fn()(v).fn()), nt.fn()(n).maps_to (vt.fn()(v).fn()))}))})});

//   Divergence inline macro support.
//   Divergence promotes strings into functions with a macro mechanism very similar to the one here. Because of this, we can enable code transformation inside those inline macros, including
//   translating operators into method calls, etc. By default this isn't enabled (primarily so that users of this library have a very easy way to disable operator overloading etc.) but you can
//   enable it like this:

  r.enable_inline_macro = (function (enabled) {return function () {enabled || (enabled = !! d.inline_macros.push ('$0.toString()'.compose (r.transform).compose (r.parse)))}}) (false)}) ();

// Unit test utilities.

  var print        = this.print || function (x) {require('sys').print(x + '\n')};

  var assert       = function (x, msg) {if (! x) throw new Error ("Assertion failed: " + msg)};
  var assert_equal = function (x, y, msg) {x === y || assert (x === y, msg + ' -- ' + x.toString () + ' !== ' + y.toString ())};

  var trace        = function (x) {print (x); return x};
  var test         = function (s) {print (s + '  =>  ' + d.rebase.parse (s).toString() + '  =>  ' + d.rebase.transform (d.rebase.parse (s)))};

  d.tracer = print;
  d.rebase.trace = d.trace;

// Parse tests.

  test ('foo.bar.bif.baz');
  test ('foo . bar . bif . baz');
  test ('foo + bar * bif');
  test ('foo * bar + bif');

  test ('100 += 200 * 300');
  test ('foo += bar * bif');
  test ('foo + -5');

  test ('foo++');
  test ('++foo');

//  test ('foo++ + 5');
//  test ('++foo + 5');

  test ('foo + bar++');
  test ('foo + ++bar');

  test ('/foo/omg + /bar/omg');

  test ('if (foo) bar;');
  test ('if (foo) bar; else bif;');

  test ('foo(function (x) {return x + 1}, function (y) {return y + 1})');

  test ('x >$> (x + 1)');
  test ('x >$>$> (x + 1)');

  test ('(foo << bar) >>$- (x >$> x + 1)');

  test ('[1, 2, 3] * (x >$> x + 1)');
  test ('[1, 2, 3] * (x >$> x) + 1');

  test ('x + (() >$> y + 5)');
  test ('x + ((y, z) >$> y + 5)');

  test ('x +$>> y');

  test ('foo ? bar : bif');

  test ('foo ? bar + bok : bif');
  test ('foo ? bar ? bif : baz : bok');
  test ('foo ? bar ? bif : baz : bok; quux');
  test ('foo ? bar ? bif : baz : bok = quux');

  test ('foo + (bar == bif) * (baz === bok)');

  test ('foo () () () ()');

  test ('typeof new new new new foo ()');

  test ('foo instanceof bar');
  test ('foo in bar');

  test ('foo >$* (x + bar >>$>> baz)');
  test ('foo >>$- bar');
  test ('foo > $ * bar >> -baz');

  test ('foo + bar(bif)');
  test ('foo() + bar()');

  test ('foo = bar = baz');

  test ('foo(bif)');
  test ('foo // bif\n(bar)');
  test ('foo /* bar */ (bif)');
  test ('foo("bar + bif")');
  test ('foo("bar\\" + bif\\"")');
  test ('foo(/bar + bif/)');
  test ('foo(\'bar + bif\')');
  test ('{foo: "bar", bif: "baz"}');
  test ('{foo: "bar", bif: "baz" || "bok"}');
  test ('{foo: "bar" ? "bif" : "baz", bar: "bif" || "baz"}');
  test ('[foo, bar, bif, baz]');

  Number.prototype['<<'] = function (x) {return [this, x]};

  print (d.rebase (function (x) {return 3 << x}) (4));
  print (d.rebase (function (x) {return literal (3 << x)}) (4));

  var f = d.rebase (function (x) {return x >$>> 1});
  print (f ({'>$>>': function (y) {return y + 1}}));

  Array.prototype['<<'] = function () {this.push.apply (this, arguments); return this};
  print (d.rebase (function (x) {return x << 4}) ([1, 2, 3]));
  print (d.rebase (function (x) {return (y) >$> x + y}) (5) (6));

  print (d.rebase (function (x) {return x + -5}) (1));

  print (d.rebase ('[1, 2, 3] << 4'));

  print (d.rebase ('false && true'));
  print (d.rebase ('false || false'));

  d.rebase.enable_inline_macro();

  print ('(x >$> x + 1) ($0)'.fn() (5));