const Prec = require('./precedence')
const {
  commaSep1,
  buildSimpleBlock,
  buildCompoundBlock,
  buildTuple,
  buildStruct,
  buildList,
  buildMember,
  buildString,
  buildAbstractionBranch,
  buildTypeParameters,
} = require('./util')

module.exports = {
  _expression: ($) =>
    choice(seq($._simple_expression, $._newline), $._compound_expression),
  _simple_expression: ($) =>
    prec.left(
      Prec.Term,
      choice(
        $.group,
        alias($.simple_abstraction, $.abstraction),
        $.application,
        $.prefix_application,
        $.infix_application,
        $.pipeline,
        $.access,
        alias($.simple_assignment, $.assignment),
        $.import,
        $.exported_import,
        alias($.simple_export, $.export),
        $.return,
        alias($.simple_if, $.if),
        $.struct,
        $.tuple,
        $.list,
        $.list_comprehension,
        $.named_value,
        $.type_alias,
        $.type_hint,
        $.identifier,
        $._literal,
      ),
    ),
  _compound_expression: ($) =>
    prec.left(
      Prec.Term,
      choice(
        alias($.compound_abstraction, $.abstraction),
        alias($.compound_assignment, $.assignment),
        alias($.compound_export, $.export),
        alias($.compound_if, $.if),
        $.case,
        $.module,
        $.enum,
        $.interface,
        $.implement,
      ),
    ),

  type_parameters: ($) => buildTypeParameters($.type_variable_declaration),
  type_arguments: ($) => buildTypeParameters($.parametric_type),

  _simple_block: ($) => prec.left(field('expression', $._simple_expression)),
  _compound_block: ($) =>
    prec.left(
      choice(
        buildSimpleBlock($, field('expression', $._simple_expression)),
        buildCompoundBlock($, repeat1(field('expression', $._expression))),
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
        field('value', $._simple_expression),
      ),
    ),
  compound_assignment: ($) =>
    prec.right(
      Prec.Assignment,
      seq(
        field('pattern', $._assignable_pattern),
        ':=',
        choice(
          field('value', $._compound_expression),
          seq($._indent, field('value', $._compound_expression), $._dedent),
        ),
      ),
    ),

  module_: ($) =>
    seq(
      'module',
      field('name', alias($.identifier, $.identifier_pattern_name)),
      optional(
        field('parameters', buildTypeParameters($.type_variable_declaration)),
      ),
      'where',
      field('body', alias($._compound_block, $.block)),
    ),

  enum_: ($) =>
    seq(
      'enum',
      field('name', $.type),
      buildCompoundBlock($, repeat1(field('value', $.enum_value))),
    ),
  enum_value: ($) =>
    seq(field('name', $.type), optional(seq('=', field('value', $._literal)))),

  interface: ($) =>
    seq(
      'interface',
      field('name', $.type_declaration),
      buildCompoundBlock($, repeat1(field('member', $.identifier_pattern))),
    ),

  implement: ($) =>
    seq(
      'implement',
      field('name', $.parametric_type),
      buildCompoundBlock(
        $,
        repeat1(
          choice(
            buildSimpleBlock(
              $,
              field('assignment', alias($.simple_assignment, $.assignment)),
            ),
            field('assignment', alias($.compound_assignment, $.assignment)),
          ),
        ),
      ),
    ),

  parameters: ($) => buildTuple($, $._pattern, true, true),
  arguments: ($) => buildTuple($, $.argument, true, true),
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
    prec.left(buildAbstractionBranch($, $._simple_block)),
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
    prec.left(buildAbstractionBranch($, $._compound_block)),

  application: ($) =>
    prec(
      Prec.Application,
      seq(
        field('name', $._simple_expression),
        optional(field('typeArguments', $.type_arguments)),
        field('arguments', $.arguments),
      ),
    ),
  prefix_application: ($) =>
    prec.right(
      Prec.PrefixApplication,
      seq(
        field('name', alias($._operator, $.identifier)),
        field('value', $._simple_expression),
      ),
    ),
  infix_application: ($) =>
    choice(
      prec.left(
        Prec.Not,
        seq(
          field('left', $._simple_expression),
          field('name', alias('!', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Exponentiation,
        seq(
          field('left', $._simple_expression),
          field('name', alias('^', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._simple_expression),
          field('name', alias('*', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._simple_expression),
          field('name', alias('/', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._simple_expression),
          field('name', alias('+', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._simple_expression),
          field('name', alias('-', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Mod,
        seq(
          field('left', $._simple_expression),
          field('name', alias('%', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_expression),
          field('name', alias('<', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_expression),
          field('name', alias('<=', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_expression),
          field('name', alias('>', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._simple_expression),
          field('name', alias('>=', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._simple_expression),
          field('name', alias('==', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._simple_expression),
          field('name', alias('!=', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.And,
        seq(
          field('left', $._simple_expression),
          field('name', alias('&&', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Or,
        seq(
          field('left', $._simple_expression),
          field('name', alias('||', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Implication,
        seq(
          field('left', $._simple_expression),
          field('name', alias('==>', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.Biconditional,
        seq(
          field('left', $._simple_expression),
          field('name', alias('<=>', $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.OperatorInfixApplication,
        seq(
          field('left', $._simple_expression),
          field('name', alias($._operator, $.identifier)),
          field('right', $._simple_expression),
        ),
      ),
      prec.left(
        Prec.NamedInfixApplication,
        seq(
          field('left', $._simple_expression),
          '`',
          field('name', alias($._identifier_without_operators, $.identifier)),
          '`',
          field('right', $._simple_expression),
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
      field('value', $._simple_expression),
      optional(seq('if', field('condition', $._simple_expression))),
    ),

  pipeline: ($) =>
    prec.left(
      Prec.Pipeline,
      seq(
        field('value', $._simple_expression),
        '.',
        field('name', $._simple_expression),
      ),
    ),

  access: ($) =>
    prec.left(
      Prec.Access,
      seq(
        field('name', $._simple_expression),
        choice(
          seq('[', field('value', $._simple_expression), ']'),
          seq(
            '->',
            field('value', alias($.identifier, $.shorthand_access_identifier)),
          ),
        ),
      ),
    ),

  return_: ($) =>
    prec.right(seq('return', field('value', $._simple_expression))),

  simple_if: ($) =>
    prec.right(
      seq(
        'if',
        field('condition', $._simple_expression),
        'then',
        field('body', alias($._simple_block, $.block)),
        optional(seq('else', field('else', alias($._simple_block, $.block)))),
      ),
    ),
  compound_if: ($) =>
    prec.right(
      seq(
        'if',
        field('condition', $._simple_expression),
        'then',
        field('body', alias($._compound_block, $.block)),
        repeat(field('else_if', $.else_if)),
        optional(seq('else', field('else', alias($._compound_block, $.block)))),
      ),
    ),
  else_if: ($) =>
    seq(
      'else if',
      field('condition', $._simple_expression),
      'then',
      field('body', alias($._compound_block, $.block)),
    ),

  case_: ($) =>
    seq(
      'case',
      field('value', $._simple_expression),
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
      buildStruct(
        $,
        choice($.member, alias($.identifier, $.shorthand_member), $.spread),
      ),
    ),
  member: ($) => buildMember($, $._simple_expression, $._simple_expression),

  tuple: ($) => prec(Prec.Term, buildTuple($, $._element)),

  list: ($) => prec(Prec.Term, buildList($, $._element)),

  _element: ($) => choice($._simple_expression, $.spread),
  spread: ($) => seq('...', field('value', $._simple_expression)),

  named_value: ($) =>
    prec.right(
      seq(
        field('name', alias($.identifier, $.constructor)),
        ':',
        field('value', $._simple_expression),
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
      seq(field('value', $._simple_expression), 'as', field('type', $._type)),
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

  raw_string: ($) => buildString($),
  string: ($) =>
    buildString(
      $,
      field('interpolation', $.interpolation),
      field('escape_sequence', $.escape_sequence),
    ),
  interpolation: ($) => seq('{', field('value', $._simple_expression), '}'),
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

  group: ($) => seq('(', field('expression', $._simple_expression), ')'),
}
