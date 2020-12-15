const Prec = require('./precedence')
const {
  simple,
  compound,
  commaSep1,
  tuple,
  struct,
  list,
  member,
  string,
  abstractionBranch,
  typeArguments,
  typeParameters,
} = require('./util')

module.exports = {
  _term: ($) => choice(seq($._simple_term, $._newline), $._compound_term),
  _simple_term: ($) =>
    prec.left(
      Prec.Term,
      choice(
        $.import,
        $.exported_import,
        alias($.simple_export, $.export),
        alias($.simple_assignment, $.assignment),
        alias($.simple_abstraction, $.abstraction),
        $.application,
        $.prefix_application,
        $.infix_application,
        $.list_comprehension,
        $.pipeline,
        $.access,
        $.return,
        alias($.simple_if, $.if),
        $.struct,
        $.tuple,
        $.list,
        $.named_value,
        $.type_alias,
        $.type_hint,
        $.identifier,
        $._literal,
        $.parametric_type,
        $.group,
      ),
    ),
  _compound_term: ($) =>
    prec.left(
      Prec.Term,
      choice(
        alias($.compound_export, $.export),
        alias($.compound_assignment, $.assignment),
        $.module,
        $.enum,
        $.interface,
        $.implement,
        alias($.compound_if, $.if),
        $.case,
      ),
    ),

  _simple_block: ($) => prec.left(field('term', $._simple_term)),
  _compound_block: ($) =>
    prec.left(
      choice(
        simple($, field('term', $._simple_term)),
        compound($, repeat1(field('term', $._term))),
      ),
    ),

  import_: ($) => seq('import', $._import_body),
  exported_import: ($) => seq('export', $._import_body),
  _import_body: ($) =>
    seq(
      commaSep1(field('import', choice($.import_identifier, $.import_type))),
      'from',
      field('source', $.raw_string),
    ),
  import_identifier: ($) =>
    seq(
      optional(
        seq(
          field('name', alias($.identifier, $.identifier_pattern_name)),
          'as',
        ),
      ),
      field('as', $.identifier_pattern),
    ),
  import_type: ($) =>
    seq(field('name', $.type), optional(seq('as', field('as', $.type)))),

  simple_export: ($) =>
    seq('export', field('declaration', $._simple_declaration)),
  compound_export: ($) =>
    seq('export', field('declaration', $._compound_declaration)),
  _simple_declaration: ($) => choice(alias($.simple_assignment, $.assignment)),
  _compound_declaration: ($) =>
    choice(alias($.compound_assignment, $.assignment), $.module),

  simple_assignment: ($) =>
    prec.right(
      Prec.Assignment,
      seq(
        field('pattern', $._assignable_pattern),
        ':=',
        field('value', $._simple_term),
      ),
    ),
  compound_assignment: ($) =>
    prec.right(
      Prec.Assignment,
      seq(
        field('pattern', $._assignable_pattern),
        ':=',
        choice(
          field('value', $._compound_term),
          seq($._indent, field('value', $._compound_term), $._dedent),
        ),
      ),
    ),

  module_: ($) =>
    seq(
      'module',
      field('name', alias($.identifier, $.identifier_pattern_name)),
      optional(field('parameters', typeParameters($))),
      'where',
      field('body', alias($._compound_block, $.block)),
    ),

  enum_: ($) =>
    seq(
      'enum',
      field('name', $.type),
      compound($, repeat1(field('value', $.enum_value))),
    ),
  enum_value: ($) =>
    seq(field('name', $.type), optional(seq('=', field('value', $._literal)))),

  interface: ($) =>
    seq(
      'interface',
      field('name', $.type_declaration),
      compound($, repeat1(field('member', $.identifier_pattern))),
    ),

  implement: ($) =>
    seq(
      'implement',
      field('name', $.parametric_type),
      compound(
        $,
        repeat1(
          choice(
            simple(
              $,
              field('assignment', alias($.simple_assignment, $.assignment)),
            ),
            field('assignment', alias($.compound_assignment, $.assignment)),
          ),
        ),
      ),
    ),

  parameters: ($) => tuple($, $._pattern, true, true),
  arguments: ($) => tuple($, $.argument, true, true),
  argument: ($) =>
    prec.left(choice(field('placeholder', '?'), field('value', $._element))),

  simple_abstraction: ($) =>
    prec.left(
      commaSep1(
        field(
          'branch',
          alias($.simple_abstraction_branch, $.abstraction_branch),
        ),
      ),
    ),
  simple_abstraction_branch: ($) =>
    prec.left(abstractionBranch($, $._simple_block)),
  compound_abstraction: ($) =>
    prec.left(
      repeat1(
        field(
          'branch',
          alias($.compound_abstraction_branch, $.abstraction_branch),
        ),
      ),
    ),
  compound_abstraction_branch: ($) =>
    prec.left(abstractionBranch($, $._compound_block)),

  application: ($) =>
    prec(
      Prec.Application,
      seq(
        field('name', $._simple_term),
        optional(field('typeArguments', typeArguments($))),
        field('arguments', $.arguments),
      ),
    ),
  prefix_application: ($) =>
    prec.right(
      Prec.PrefixApplication,
      seq(
        field('name', alias($._operator, $.identifier)),
        field('value', $._simple_term),
      ),
    ),
  infix_application: ($) =>
    choice(
      prec.left(
        Prec.Not,
        seq(
          field('left', $._simple_term),
          field('name', alias('!', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Exponentiation,
        seq(
          field('left', $._simple_term),
          field('name', alias('^', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._simple_term),
          field('name', alias('*', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._simple_term),
          field('name', alias('/', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._simple_term),
          field('name', alias('+', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._simple_term),
          field('name', alias('-', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Mod,
        seq(
          field('left', $._simple_term),
          field('name', alias('%', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_term),
          field('name', alias('<', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_term),
          field('name', alias('<=', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_term),
          field('name', alias('>', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_term),
          field('name', alias('>=', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._simple_term),
          field('name', alias('==', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._simple_term),
          field('name', alias('!=', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.And,
        seq(
          field('left', $._simple_term),
          field('name', alias('&&', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Or,
        seq(
          field('left', $._simple_term),
          field('name', alias('||', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Implication,
        seq(
          field('left', $._simple_term),
          field('name', alias('==>', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.Biconditional,
        seq(
          field('left', $._simple_term),
          field('name', alias('<=>', $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.OperatorInfixApplication,
        seq(
          field('left', $._simple_term),
          field('name', alias($._operator, $.identifier)),
          field('right', $._simple_term),
        ),
      ),
      prec.left(
        Prec.NamedInfixApplication,
        seq(
          field('left', $._simple_term),
          '`',
          field('name', alias($._identifier_without_operators, $.identifier)),
          '`',
          field('right', $._simple_term),
        ),
      ),
    ),

  list_comprehension: ($) =>
    seq(
      '[',
      field('body', alias($._simple_block, $.block)),
      '|',
      commaSep1(field('generator', $.generator)),
      ']',
    ),
  generator: ($) =>
    seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      'in',
      field('value', $._simple_term),
      optional(seq('if', field('condition', $._simple_term))),
    ),

  pipeline: ($) =>
    prec.left(
      Prec.Pipeline,
      seq(field('value', $._simple_term), '.', field('name', $._simple_term)),
    ),

  access: ($) =>
    prec.left(
      Prec.Access,
      seq(
        field('name', $._simple_term),
        choice(
          seq('[', field('value', $._simple_term), ']'),
          seq(
            '->',
            field('value', alias($.identifier, $.shorthand_access_identifier)),
          ),
        ),
      ),
    ),

  return_: ($) => prec.right(seq('return', field('value', $._simple_term))),

  simple_if: ($) =>
    prec.right(
      seq(
        'if',
        field('condition', $._simple_term),
        'then',
        field('body', alias($._simple_block, $.block)),
        optional(seq('else', field('else', alias($._simple_block, $.block)))),
      ),
    ),
  compound_if: ($) =>
    prec.right(
      seq(
        'if',
        field('condition', $._simple_term),
        'then',
        field('body', alias($._compound_block, $.block)),
        repeat(field('else_if', $.else_if)),
        optional(seq('else', field('else', alias($._compound_block, $.block)))),
      ),
    ),
  else_if: ($) =>
    seq(
      'else if',
      field('condition', $._simple_term),
      'then',
      field('body', alias($._compound_block, $.block)),
    ),

  case_: ($) =>
    seq(
      'case',
      field('value', $._simple_term),
      repeat1(field('when', $.when)),
      'else',
      field('else', alias($._compound_block, $.block)),
    ),
  when: ($) =>
    seq(
      'when',
      commaSep1(field('pattern', $._pattern)),
      'then',
      field('body', alias($._compound_block, $.block)),
    ),

  struct: ($) =>
    prec(
      Prec.Term,
      struct(
        $,
        choice($.member, alias($.identifier, $.shorthand_member), $.spread),
      ),
    ),
  member: ($) => member($, $._simple_term, $._simple_term),

  tuple: ($) => prec(Prec.Term, tuple($, $._element)),

  list: ($) => prec(Prec.Term, list($, $._element)),

  _element: ($) => choice($._simple_term, $.spread),
  spread: ($) => seq('...', field('value', $._simple_term)),

  named_value: ($) =>
    prec.right(
      seq(
        field('name', alias($.identifier, $.constructor)),
        field('value', $._simple_term),
      ),
    ),

  type_alias: ($) =>
    seq(
      'type',
      field('name', $.type_declaration),
      ':=',
      field('type', $._type),
    ),

  type_hint: ($) =>
    prec.left(
      Prec.TypeHint,
      seq(field('value', $._simple_term), 'as', field('type', $._type)),
    ),

  _identifier_without_operators: ($) => /_?[a-z][a-z0-9_]*\??/,
  _operator: ($) => /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=?]*/,
  identifier: ($) => choice($._operator, $._identifier_without_operators),

  _literal: ($) =>
    prec(Prec.Literal, choice($.boolean, $.number, $.string, $.regex)),

  boolean: () => choice('false', 'true'),

  _decimal: () => {
    const digits = repeat1(/_?[0-9]+/)
    const exponent = seq(/e-?/, digits)

    return token(
      choice(
        seq(digits, '.', digits, optional(exponent)),
        seq(digits, exponent),
      ),
    )
  },
  _integer: () =>
    token(
      choice(
        seq('0x', repeat1(/_?[A-Fa-f0-9]+/)),
        seq('0o', repeat1(/_?[0-7]+/)),
        seq('0b', repeat1(/_?[0-1]+/)),
        seq(repeat1(/_?[0-9]+/)),
      ),
    ),
  number: ($) => choice($._decimal, $._integer),

  raw_string: ($) => string($),
  string: ($) =>
    string(
      $,
      field('interpolation', $.interpolation),
      field('escape_sequence', $.escape_sequence),
    ),
  interpolation: ($) => seq('{', field('value', $._simple_term), '}'),
  escape_sequence: ($) =>
    token.immediate(
      seq(
        '\\',
        choice(
          /[^xu0-7]/,
          /[0-7]{1,3}/,
          /x[0-9a-fA-F]{2}/,
          /u[0-9a-fA-F]{4}/,
          /u{[0-9a-fA-F]+}/,
        ),
      ),
    ),

  regex: ($) =>
    seq(
      'r/',
      field('pattern', $.regex_pattern),
      '/',
      optional(field('flags', $.regex_flags)),
    ),
  regex_pattern: () =>
    token.immediate(
      repeat1(
        choice(
          seq('[', repeat(choice(seq('\\', /./), /[^\]\n\\]/)), ']'),
          seq('\\', /./),
          /[^/\\\[\n]/,
        ),
      ),
    ),
  regex_flags: () => token.immediate(/[a-z]+/),

  group: ($) => seq('(', field('term', $._simple_term), ')'),
}
