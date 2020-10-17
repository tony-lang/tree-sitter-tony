const PREC = Object.freeze({
  TYPE_HINT: 1,
  CURRIED_TYPE: 1,
  UNION_TYPE: 1,
  NAMED_INFIX: 1,
  VALUE_LITERAL: 1,
  INTERSECTION_TYPE: 2,
  OPERATOR_INFIX: 2,
  BICONDITIONAL: 3,
  IMPLICATION: 4,
  OR: 5,
  AND: 6,
  EQUALITY: 7,
  ORDER: 8,
  MOD: 9,
  SUM: 10,
  PRODUCT: 11,
  EXPONENTIATION: 12,
  NOT: 13,
  PREFIX: 14,
  EXPRESSION: 15,
  PATTERN: 15,
  APPLICATION: 16,
  PIPELINE: 17,
  ACCESS: 18,
})

const notFalse = (...args) => args.filter((element) => element !== false)

const commaSep2 = (rule) => seq(rule, repeat1(seq(',', rule)))

const commaSep1 = (rule) => seq(rule, repeat(seq(',', rule)))

const commaSep0 = (rule) => optional(commaSep1(rule))

const commaSep = (rule, minLength = 0) => {
  switch (minLength) {
    case 0:
      return commaSep0(rule)
    case 1:
      return commaSep1(rule)
    case 2:
      return commaSep2(rule)
    default:
      throw new Error('commaSep is not implemented for minLength > 2')
  }
}

const abstractionBranch = ($, blockType) =>
  seq(
    field('parameters', $.tuple_pattern),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const dataStructure = ($, element, rest, minLength) =>
  choice(
    ...notFalse(
      rest && field('rest', $.rest),
      seq(
        ...notFalse(
          commaSep(element, minLength),
          rest && optional(seq(',', field('rest', $.rest))),
        ),
      ),
    ),
  )

const struct = ($, member, rest = false) =>
  seq('{', dataStructure($, field('member', member), rest, 0), '}')

const tuple = ($, element, rest = false, minLength = 0) =>
  seq('(', dataStructure($, field('value', element), rest, minLength), ')')

const namedTuple = ($, name, element, rest = false) =>
  seq(field('name', name), tuple($, element, rest, 0))

const list = ($, element, rest = false) =>
  seq('[', dataStructure($, field('element', element), rest, 0), ']')

const member = (key, shorthand, value) =>
  seq(
    choice(seq('[', field('key', key), ']'), field('key', shorthand)),
    ':',
    field('value', value),
  )

const string = ($, ...content) =>
  seq(
    $._string_start,
    repeat(choice(...content, $._string_content)),
    $._string_end,
  )

const simple = ($, line) => seq(line, $._newline)

const compound = ($, body) => seq($._newline, $._indent, body, $._dedent)

module.exports = grammar({
  name: 'tony',

  externals: ($) => [
    $._newline,
    $._indent,
    $._dedent,
    $._string_start,
    $._string_content,
    $._string_end,
  ],
  extras: ($) => [$.comment, /\s+/],
  word: ($) => $._identifier_without_operators,
  conflicts: ($) => [
    [$._simple_block, $._compound_block],
    [$._simple_expression, $.identifier_pattern],
    [$._literal, $._literal_pattern],
    [$.string, $.string_pattern],
    [$.struct, $.struct_pattern],
    [$.tuple, $.tuple_pattern],
    [$.list, $.list_pattern],
    [$.type_declaration, $._type_constructor],
  ],

  rules: {
    program: ($) =>
      seq(
        optional(field('hash_bang_line', $.hash_bang_line)),
        optional(repeat1(field('expression', $._expression))),
      ),
    hash_bang_line: ($) => /#!.*/,

    _expression: ($) =>
      choice(seq($._simple_expression, $._newline), $._compound_expression),
    _simple_expression: ($) =>
      prec.left(
        PREC.EXPRESSION,
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
          $.external_export,
          alias($.simple_export, $.export),
          $.return,
          alias($.simple_if, $.if),
          $.struct,
          $.tuple,
          $.list,
          $.list_comprehension,
          $.type_alias,
          $.type_hint,
          $.identifier,
          $._literal,
        ),
      ),
    _compound_expression: ($) =>
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
        $.struct_declaration,
      ),

    _simple_declaration: ($) =>
      choice(alias($.simple_assignment, $.assignment)),
    _compound_declaration: ($) =>
      choice(alias($.compound_assignment, $.assignment), $.module),

    _simple_block: ($) => field('expression', $._simple_expression),
    _compound_block: ($) =>
      choice(
        simple($, field('expression', $._simple_expression)),
        compound($, repeat1(field('expression', $._expression))),
      ),

    _pattern: ($) =>
      choice(
        $.identifier_pattern,
        $._destructuring_pattern,
        $._literal_pattern,
      ),

    _destructuring_pattern: ($) =>
      choice($.struct_pattern, $.tuple_pattern, $.list_pattern),
    struct_pattern: ($) =>
      prec(
        PREC.PATTERN,
        struct(
          $,
          choice(
            $.member_pattern,
            alias($.identifier_pattern, $.shorthand_member_pattern),
          ),
          true,
        ),
      ),
    tuple_pattern: ($) => prec(PREC.PATTERN, tuple($, $._pattern, true)),
    list_pattern: ($) => prec(PREC.PATTERN, list($, $._pattern, true)),
    member_pattern: ($) =>
      member(
        $._simple_expression,
        alias($.identifier, $.shorthand_access_identifier),
        $._pattern,
      ),
    rest: ($) => seq('...', field('name', $.identifier_pattern)),

    _literal_pattern: ($) =>
      choice($.parametric_type, $.boolean, $.number, $.string_pattern, $.regex),
    string_pattern: ($) =>
      string($, field('escape_sequence', $.escape_sequence)),

    identifier_pattern: ($) =>
      prec.right(
        PREC.PATTERN,
        seq(
          field('name', alias($.identifier, $.identifier_pattern_name)),
          optional(seq('::', field('type', $._type_constructor))),
          optional(seq('=', field('default', $._simple_expression))),
        ),
      ),

    group: ($) => seq('(', field('value', $._simple_expression), ')'),

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
        PREC.APPLICATION,
        namedTuple($, $._simple_expression, $.tuple_element),
      ),
    prefix_application: ($) =>
      prec.right(
        PREC.PREFIX,
        seq(
          field('name', alias($._operator, $.identifier)),
          field('value', $._simple_expression),
        ),
      ),
    infix_application: ($) =>
      choice(
        prec.left(
          PREC.NOT,
          seq(
            field('left', $._simple_expression),
            field('name', alias('!', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.EXPONENTIATION,
          seq(
            field('left', $._simple_expression),
            field('name', alias('^', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.PRODUCT,
          seq(
            field('left', $._simple_expression),
            field('name', alias('*', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.PRODUCT,
          seq(
            field('left', $._simple_expression),
            field('name', alias('/', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.SUM,
          seq(
            field('left', $._simple_expression),
            field('name', alias('+', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.SUM,
          seq(
            field('left', $._simple_expression),
            field('name', alias('-', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.MOD,
          seq(
            field('left', $._simple_expression),
            field('name', alias('%', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.ORDER,
          seq(
            field('left', $._simple_expression),
            field('name', alias('<', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.ORDER,
          seq(
            field('left', $._simple_expression),
            field('name', alias('<=', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.ORDER,
          seq(
            field('left', $._simple_expression),
            field('name', alias('>', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.ORDER,
          seq(
            field('left', $._simple_expression),
            field('name', alias('>=', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.EQUALITY,
          seq(
            field('left', $._simple_expression),
            field('name', alias('==', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.EQUALITY,
          seq(
            field('left', $._simple_expression),
            field('name', alias('!=', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.EQUALITY,
          seq(
            field('left', $._simple_expression),
            field('name', alias('===', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.EQUALITY,
          seq(
            field('left', $._simple_expression),
            field('name', alias('!==', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.AND,
          seq(
            field('left', $._simple_expression),
            field('name', alias('&&', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.OR,
          seq(
            field('left', $._simple_expression),
            field('name', alias('||', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.IMPLICATION,
          seq(
            field('left', $._simple_expression),
            field('name', alias('==>', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.BICONDITIONAL,
          seq(
            field('left', $._simple_expression),
            field('name', alias('<=>', $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.OPERATOR_INFIX,
          seq(
            field('left', $._simple_expression),
            field('name', alias($._operator, $.identifier)),
            field('right', $._simple_expression),
          ),
        ),
        prec.left(
          PREC.NAMED_INFIX,
          seq(
            field('left', $._simple_expression),
            '`',
            field('name', alias($._identifier_without_operators, $.identifier)),
            '`',
            field('right', $._simple_expression),
          ),
        ),
      ),

    pipeline: ($) =>
      prec.left(
        PREC.PIPELINE,
        seq(
          field('value', $._simple_expression),
          '.',
          field('name', $._simple_expression),
        ),
      ),

    access: ($) =>
      prec.left(
        PREC.ACCESS,
        seq(
          field('name', $._simple_expression),
          choice(
            seq('[', field('value', $._simple_expression), ']'),
            seq(
              '->',
              field(
                'value',
                alias($.identifier, $.shorthand_access_identifier),
              ),
            ),
          ),
        ),
      ),

    simple_assignment: ($) =>
      prec.right(
        seq(
          field(
            'pattern',
            choice($.identifier_pattern, $._destructuring_pattern),
          ),
          ':=',
          field('value', $._simple_expression),
        ),
      ),
    compound_assignment: ($) =>
      prec.right(
        seq(
          field(
            'pattern',
            choice($.identifier_pattern, $._destructuring_pattern),
          ),
          ':=',
          choice(
            field('value', $._compound_expression),
            seq($._indent, field('value', $._compound_expression), $._dedent),
          ),
        ),
      ),

    import: ($) => seq('import', $._import_body),
    external_export: ($) => seq('export', $._import_body),
    _import_body: ($) =>
      seq(
        commaSep1(
          field(
            'import',
            choice(
              $.identifier_pattern,
              $.import_identifier_pair,
              $.type,
              $.import_type_pair,
            ),
          ),
        ),
        'from',
        field('source', $.string_pattern),
      ),
    import_identifier_pair: ($) =>
      seq(
        field('name', alias($.identifier, $.identifier_pattern_name)),
        'as',
        field('as', $.identifier_pattern),
      ),
    import_type_pair: ($) =>
      seq(field('name', $.type), 'as', field('as', $.type)),

    simple_export: ($) =>
      seq('export', field('declaration', $._simple_declaration)),
    compound_export: ($) =>
      seq('export', field('declaration', $._compound_declaration)),

    return: ($) =>
      prec.right(seq('return', optional(field('value', $._simple_expression)))),

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
          optional('then'),
          field('body', alias($._compound_block, $.block)),
          repeat(field('else_if', $.else_if)),
          optional(
            seq('else', field('else', alias($._compound_block, $.block))),
          ),
        ),
      ),
    else_if: ($) =>
      seq(
        'else if',
        field('condition', $._simple_expression),
        optional('then'),
        field('body', alias($._compound_block, $.block)),
      ),

    case: ($) =>
      seq(
        'case',
        field('value', $._simple_expression),
        repeat1(field('when', $.when)),
        optional(seq('else', field('else', alias($._compound_block, $.block)))),
      ),
    when: ($) =>
      seq(
        'when',
        commaSep1(field('pattern', $._pattern)),
        optional('then'),
        field('body', alias($._compound_block, $.block)),
      ),

    module: ($) =>
      seq(
        'module',
        field('name', $.type_declaration),
        optional('where'),
        field('body', alias($._compound_block, $.block)),
      ),

    enum: ($) =>
      seq(
        'enum',
        field('name', $.type),
        $._newline,
        $._indent,
        repeat1(field('value', $.enum_value)),
        $._dedent,
      ),
    enum_value: ($) =>
      seq(
        field('name', $.type),
        optional(seq('=', field('value', $._value_literal))),
      ),

    interface: ($) =>
      seq(
        'interface',
        field('name', $.type_declaration),
        $._newline,
        $._indent,
        repeat1(field('member', $.member_type)),
        $._dedent,
      ),

    implement: ($) =>
      seq(
        'implement',
        field('name', $.parametric_type),
        $._newline,
        $._indent,
        repeat1(
          choice(
            seq(
              field('assignment', alias($.simple_assignment, $.assignment)),
              $._newline,
            ),
            field('assignment', alias($.compound_assignment, $.assignment)),
          ),
        ),
        $._dedent,
      ),

    struct_declaration: ($) =>
      seq(
        'struct',
        field('name', $.type_declaration),
        $._newline,
        $._indent,
        repeat1(field('member', $.member_type)),
        $._dedent,
      ),

    struct: ($) =>
      prec(
        PREC.EXPRESSION,
        struct(
          $,
          choice(
            $.member,
            alias($.identifier, $.shorthand_pair_identifier),
            alias($.spread, $.spread_struct),
          ),
        ),
      ),
    tuple: ($) =>
      prec(
        PREC.EXPRESSION,
        tuple($, $.tuple_element, false, 2),
      ),
    tuple_element: ($) =>
      prec.left(
        choice(
          field('placeholder', '?'),
          field('value', choice($._simple_expression, $.spread)),
        ),
      ),
    list: ($) =>
      prec(
        PREC.EXPRESSION,
        seq(
          '[',
          commaSep(
            field(
              'element',
              choice($._simple_expression, alias($.spread, $.spread_list)),
            ),
          ),
          ']',
        ),
      ),
    member: ($) =>
      seq(
        choice(
          seq('[', field('key', $._simple_expression), ']'),
          field('key', alias($.identifier, $.shorthand_access_identifier)),
        ),
        ':',
        field('value', $._simple_expression),
      ),
    spread: ($) => seq('...', field('value', $._simple_expression)),

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

    type_alias: ($) =>
      seq(
        'type',
        field('name', $.type_declaration),
        ':=',
        field('type', $._type_constructor),
      ),

    type_hint: ($) =>
      prec.left(
        PREC.TYPE_HINT,
        seq(
          field('value', $._simple_expression),
          'as',
          field('type', $._type_constructor),
        ),
      ),

    _type_constructor: ($) =>
      choice(
        $.type_group,
        $.typeof,
        $.parametric_type,
        $.curried_type,
        $.intersection_type,
        $.union_type,
        $.struct_type,
        $.tuple_type,
        $.list_type,
        alias($.identifier, $.type_variable),
        $._value_literal,
      ),
    type_group: ($) => seq('(', field('type', $._type_constructor), ')'),
    typeof: ($) => seq('typeof', field('value', $.identifier)),
    parametric_type: ($) =>
      prec.right(
        seq(
          field('name', $.type),
          optional(
            seq('<', commaSep1(field('parameter', $._type_constructor)), '>'),
          ),
        ),
      ),
    curried_type: ($) =>
      prec.right(
        PREC.CURRIED_TYPE,
        seq(
          field('from', $._type_constructor),
          '->',
          field('to', $._type_constructor),
        ),
      ),
    intersection_type: ($) =>
      prec.right(
        PREC.INTERSECTION_TYPE,
        seq(
          field('left', $._type_constructor),
          '&',
          field('right', $._type_constructor),
        ),
      ),
    union_type: ($) =>
      prec.right(
        PREC.UNION_TYPE,
        seq(
          field('left', $._type_constructor),
          '|',
          field('right', $._type_constructor),
        ),
      ),
    struct_type: ($) => struct($, $.member_type),
    member_type: ($) =>
      seq(
        field('name', $.identifier),
        '::',
        field('type', $._type_constructor),
      ),
    tuple_type: ($) =>
      seq('(', commaSep2(field('parameter', $._type_constructor)), ')'),
    list_type: ($) => seq('[', field('parameter', $._type_constructor), ']'),

    type_declaration: ($) =>
      seq(
        optional(seq(commaSep1(field('dependency', $.parametric_type)), '=>')),
        field('name', $.type),
        optional(
          seq(
            '<',
            field('parameter', commaSep1(alias($.identifier, $.type_variable))),
            '>',
          ),
        ),
      ),

    _identifier_without_operators: ($) => /_?[a-z][a-z0-9_]*\??/,
    _operator: ($) => /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=?]*/,
    identifier: ($) => choice($._operator, $._identifier_without_operators),

    _value_literal: ($) =>
      prec(PREC.VALUE_LITERAL, choice($.boolean, $.number, $.string, $.regex)),
    _literal: ($) => choice($.parametric_type, $._value_literal),

    type: ($) => /[A-Z][a-zA-Z0-9]*/,

    boolean: ($) => choice('false', 'true'),

    _decimal: ($) => {
      const digits = repeat1(/_?[0-9]+/)
      const exponent = seq(/e-?/, digits)

      return token(
        choice(
          seq(digits, '.', digits, optional(exponent)),
          seq(digits, exponent),
        ),
      )
    },
    _integer: ($) =>
      token(
        choice(
          seq('0x', repeat1(/_?[A-Fa-f0-9]+/)),
          seq('0o', repeat1(/_?[0-7]+/)),
          seq('0b', repeat1(/_?[0-1]+/)),
          seq(repeat1(/_?[0-9]+/)),
        ),
      ),
    number: ($) => choice($._decimal, $._integer),

    string: ($) =>
      seq(
        $._string_start,
        repeat(
          choice(
            field('interpolation', $.interpolation),
            field('escape_sequence', $.escape_sequence),
            $._string_content,
          ),
        ),
        $._string_end,
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
    regex_pattern: ($) =>
      token.immediate(
        repeat1(
          choice(
            seq('[', repeat(choice(seq('\\', /./), /[^\]\n\\]/)), ']'),
            seq('\\', /./),
            /[^/\\\[\n]/,
          ),
        ),
      ),
    regex_flags: ($) => token.immediate(/[a-z]+/),

    comment: ($) => token(seq('#', /.*/)),
  },
})
