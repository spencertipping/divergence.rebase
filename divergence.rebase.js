// Divergence Rebase module | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// Rebase is a Divergence module that takes operator invocations inside functions and rewrites them to be method invocations. Naturally, new meaning can be associated with these constructs; this
// is done by writing methods for them. For example, invocation of the '+' operator is translated into a call to the 'plus' method. Operator precedence is respected and follows the normal
// JavaScript rules.

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

  d.init (r, {precedence: {'function':1, '[!':1, '.':1, '(!':1, 'new':2, 'u++':3, 'u--':3, 'typeof':3, 'u~':3, 'u!':3, 'u+':3, 'u-':3, '*':4, '/':4, '%':4, '+':5, '-':5, '<<':6,
                           '>>':6, '>>>':6, '<':7, '>':7, '<=':7, '>=':7, 'instanceof':7, 'in':7, '==':8, '!=':8, '===':8, '!==':8, '&':9, '^':10, '|':11, '&&':12, '||':13, '?':14, '=':15,
                           '+=':15, '-=':15, '*=':15, '/=':15, '%=':15, '&=':15, '|=':15, '^=':15, '<<=':15, '>>=':15, '>>>=':15, 'case':16, ':':17, ',':18, 'var':19, 'if':19, 'while':19,
                           'for':19, 'do':19, 'switch':19, 'return':19, 'throw':19, 'delete':19, 'export':19, 'import':19, 'try':19, 'catch':19, 'finally':19, 'void':19, 'with':19, 'else':19,
                           '?:':20, ';':21, '{':22, '(':22, '[':22},

                   unary: set(qw('u++ u-- u+ u- u! u~ new typeof var case try finally throw return case else delete void import export ( [ { ?:')),
                   ident: set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_'.split ('')),                            punct: set('+-*/%&|^!~=<>?:;.,'.split ('')),
                   right: set(qw('= += -= *= /= %= &= ^= |= <<= >>= >>>= u~ u! new typeof u+ u- u++ u--')),                            openers: {'(':')', '[':']', '{':'}', '?':':'},
              sandwiches: set(qw('$ $$ $$$ _ __ ___ _$ _$$ __$')),                                                                sandwich_ops: set(qw('+ - * / % ^ | & << >> >>> < >')),
           prefix_binary: set(qw('if function catch for switch with')),                                                                closers: {')':'(', ']':'[', '}':'{', ':':'?:'},
            translations: {'u+':'+', 'u-':'-', 'u~':'~', 'u!':'!', 'u--':'--', 'u++':'++'},                                           arity_of: '$0.unary[$1] ? 1 : $1 === "?" ? 3 : 2'.fn(r),
           lvalue_assign: set(qw('+= -= *= /= %= ^= |= &= <<= >>= >>>=')),                                                             literal: set(qw('u-- u++ = (! [! . , ? ( [ === !== ; :')),
          should_convert: '! ($0.literal[$1] || $0.unary[$1] || $0.prefix_binary[$1])'.fn(r),
                  macros: ['$1 && $0.lvalue_assign[$1.op] ? $0.syntax(null, "=", [$1.xs[0], $0.syntax(null, $1.op.substring(0, $1.op.length - 1), $1.xs)]) : $1'.fn(r),
  function (e) {
  return e && (r.sandwich_ops[e.op] ? e.xs[1] && e.xs[1].op && r.sandwich_ops[e.xs[1].op] && r.sandwiches[e.xs[1].xs[0]] ? r.syntax(e.parent, e.op + e.xs[1].xs[0] + e.xs[1].op, [e.xs[0], e.xs[1].xs[1]]) :
                                      e.xs[0] && e.xs[0].op && r.sandwich_ops[e.xs[0].op] && r.sandwiches[e.xs[0].xs[1]] ? r.syntax(e.parent, e.xs[0].op + e.xs[0].xs[1] + e.op, [e.xs[0].xs[0], e.xs[1]]) :
                                      e : e)},
  function (e) {
  return e && e.op && e.op === '>$>' ? r.syntax(e.parent, 'function').with_node (e.xs[0].op === '(' ? e.xs[0] : r.syntax (null, '(', [e.xs[0]])).
                                                                      with_node (r.syntax (null, '{').with_node (r.syntax (null, 'return').with_node (e.xs[1]))) : e},

  function (e) {
  return e && e.xs && r.should_convert (e.op) ? r.syntax(e.parent, "(!").with_node(r.syntax(null, "[!", [e.xs[0], '["' + e.op + '"]'])).with_node(r.syntax(null, '(', [e.xs[1]])) : e}],

                    init: '$0.deparse($0.transform($0.parse($1.toString())))'.fn(r),

//   Deparsing.
//   This is certainly the easiest part. All we have to do is follow some straightforward rules about how operators and such get serialized. Luckily this is all encapsulated into the toString
//   logic of the syntax tree.

                 deparse: 'eval($0.toString())'.fn(),

//   Tree transformation.
//   The goal here is to transform the tree in logical form before serializing it to a final function. The way I've chosen to go about this is to use a macro table and deep-map over the syntax
//   tree. Each node gets inspected, and mapping functions can modify nodes by returning alternative values. To save space and time, I'm having macros replace structures destructively rather than
//   using a functional approach.

               transform: function (t) {var mapped = r.macros.fold ('$1($0)', t); mapped && mapped.xs && (mapped.xs = mapped.xs.map (r.transform)); return mapped},

//   Incremental parsing.
//   As tokens are read from the lexer they are written into a parse tree. Unlike a traditional grammar with productions, this parse tree works in terms of operators and values. Each element in
//   the text is considered to have a certain precedence and to comprise part of an expression. This leads to a weird model and a much more general grammar than JavaScript's, but this is
//   acceptable because we know that by the time we see the code it will be valid. The only problem is when we have nonlocal precedence alteration; one example of this is the 'in' keyword --
//   consider these two for loops:

//     | for (var i in foo = bar) {...}
//     | for (var i = 'some-key' in some_hash; ...) {...}

//   Despite being a pathological example, it demonstrates the nonlocality of the JavaScript grammar. We can't disambiguate these forms until we hit either '=' or 'in'. Once we do hit those
//   operators, the leftmost one has a precedence nearly as low as ';', since otherwise we would risk violating the lvalue. Unfortunately, cases like these require some context to parse
//   efficiently. However, rather than backtracking we can reflect the incremental refinement that we see when reading through the code; that is, upon looking at the 'for' we don't know which
//   type of for loop it is; but as we read more code we will find out. As long as we start with a general case and lazily refine, the parsing algorithm can remain O(n).

//   However, all this being said, my only goal here is to build an accurate operator-precedence structure. So we can ignore any nuances of the structure that make things difficult; in this case,
//   the minimal-effort solution is to replace the first 'in' in a for-loop with a sentinel that takes very low precedence. ('=' isn't a problem, since its precedence is already suitably low and
//   we don't override it in any case.)

//   The mechanics of this parser are fairly simple. We build a tree incrementally and include explicit nodes for parentheses (the role of these nodes will become apparent). Starting with the
//   root node, which has no particular identity, we add expressions and operators to this tree. The rules for this are:

//     | 1. When we add an expression to a tree, it is just added to the operand list. This will throw an error if there are too many operands.
//     | 2. When we add an operator to a tree, we check the precedence. If the new operator binds first, then it is added as a child, given a value, and returned. Otherwise we add it to the
//          parent.

                  syntax: '@parent = $0, @op = $1, @xs = $2 || [], $_'.type ({
                           is_value: '@xs.length >= $0.arity_of(@op)'.fn(r),
                         push_value: '! @is_value() ? (@xs.push($0), $0) : ("The token " + $0 + " is one too many for the tree " + @toString() + ".").fail()'.fn(),
                          with_node: '$0 && ($0.parent = $_), @push_value($0), $_'.fn(),
                            push_op: '$0.precedence[$1] - !! $0.right[$1] < $0.precedence[@op] ? @graft($1) : @hand_to_parent($1)'.fn(r),
                              graft: '@push_value(@is_value() ? $0.syntax($_, $1).with_node(@xs.pop()) : $0.syntax($_, $1))'.fn(r),
                     hand_to_parent: '@parent ? @parent.push_op($0) : "Syntax trees should have a minimal-precedence container".fail()'.fn(),
                                top: '@parent ? @parent.top() : $_'.fn(),
                           toString:  function () {return '([{'.indexOf(this.op) > -1 ? this.op + s(this.xs[0]) + r.openers[this.op] :
                                                                      this.op === '?' ? s(this.xs[0]) + ' ? ' + s(this.xs[1].xs[0]) + ' : ' + s(this.xs[2]) :
                                                 this.op === '(!' || this.op === '[!' ? s(this.xs[0]) + s(this.xs[1]) :
                                                                     r.unary[this.op] ? (r.translations[this.op] || this.op) + ' ' + s(this.xs[0]) :
                                                             r.prefix_binary[this.op] ? this.op + ' ' + s(this.xs[0]) + ' ' + s(this.xs[1]) :
                                                                                        s(this.xs[0]) + ' ' + this.op + ' ' + s(this.xs[1])}}),

//   Lexing.
//   The lexer is for the most part straightforward. The only tricky bit is regular expression parsing, which requires the lexer to contextualize operators and operands. I've implemented this
//   logic with a expect_re flag that indicates whether the last token processed was an operator (if so, then we're expecting an operand and the next / delineates a regular expression).

                   parse: function (s) {var i = 0, $_, l = s.length, token = '', expect_re = true, escaped = false, t = r.syntax(null, '('), c = s.charAt.bind (s), openers = [];
                          while (i < l && ($_ = c(i))) {
          escaped = token = '';
               if                                (/\s/.test ($_))                                                                        ++i;
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

               if       (t.is_value() && '[('.indexOf (token) > -1)                       t = t.push_op (token + '!').graft (token), openers.push (token);
          else if (($_ = r.closers[token]) && last(openers) === $_) {while (t.op !== $_)  t = t.parent; openers.pop(), t = t.parent}
          else if                                   (token === '?')                       t = t.push_op (token).graft ('?:'), openers.push ('?:');
          else if                                (r.openers[token])                       t = t.graft (token), openers.push (token);
          else if                             (r.precedence[token])                       t = t.push_op (token);
          else                                                                            t.push_value (token);
                          }
                          return t.top()}})}) ();