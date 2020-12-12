const PREC = Object.freeze({
  NAMED_TYPE: -1,
  ASSIGNMENT: 1,
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

const abstractionBranch = ($, blockType) =>
  seq(
    field('parameters', $.parameters),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const dataStructure = ($, element, rest, commaSepImpl = commaSep1) =>
  optional(
    choice(
      ...notFalse(
        rest && field('rest', $.rest),
        seq(
          ...notFalse(
            commaSepImpl(element),
            rest && optional(seq(',', field('rest', $.rest))),
          ),
        ),
      ),
    ),
  )

const struct = ($, member, rest = false) =>
  seq('{', dataStructure($, field('member', member), rest), '}')

const tuple = ($, element, rest = false, allowSingle = false) =>
  choice(
    '()',
    seq(
      '(',
      dataStructure(
        $,
        field('value', element),
        rest,
        allowSingle ? commaSep1 : commaSep2,
      ),
      ')',
    ),
  )

const list = ($, element, rest = false) =>
  seq('[', dataStructure($, field('element', element), rest), ']')

const member = ($, key, value) =>
  seq(
    choice(
      seq('[', field('key', key), ']'),
      field('key', alias($.identifier, $.shorthand_member_identifier)),
    ),
    ':',
    field('value', value),
  )

const string = ($, ...content) =>
  seq(
    $._string_start,
    repeat(choice(...content, $._string_content)),
    $._string_end,
  )

const parametricType = ($, parameter) =>
  seq(
    field('name', $.type),
    optional(seq('<', commaSep1(field('parameter', parameter)), '>')),
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
          $.external_import,
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

    _pattern: ($) => choice($._assignable_pattern, $._literal_pattern),

    _assignable_pattern: ($) =>
      choice(
        $.pattern_group,
        $.identifier_pattern,
        $.destructuring_pattern,
        $.named_pattern,
      ),

    pattern_group: ($) =>
      prec(PREC.PATTERN, seq('(', field('pattern', $._pattern), ')')),

    destructuring_pattern: ($) =>
      seq(
        optional(
          seq(
            field('alias', alias($.identifier, $.identifier_pattern_name)),
            '@',
          ),
        ),
        field(
          'pattern',
          choice($.struct_pattern, $.tuple_pattern, $.list_pattern),
        ),
      ),
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
    parameters: ($) => tuple($, $._pattern, true, true),
    list_pattern: ($) => prec(PREC.PATTERN, list($, $._pattern, true)),
    member_pattern: ($) => member($, $._simple_expression, $._pattern),
    rest: ($) => seq('...', field('name', $.identifier_pattern)),

    _literal_pattern: ($) =>
      choice($.parametric_type, $.boolean, $.number, $.string_pattern, $.regex),
    string_pattern: ($) =>
      string($, field('escape_sequence', $.escape_sequence)),

    named_pattern: ($) =>
      prec(
        PREC.PATTERN,
        seq(field('name', $.type), field('pattern', $._pattern)),
      ),

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
        seq(
          field('value', $._simple_expression),
          field('arguments', tuple($, $.tuple_element, true, true)),
        ),
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
        PREC.ASSIGNMENT,
        seq(
          field('pattern', $._assignable_pattern),
          ':=',
          field('value', $._simple_expression),
        ),
      ),
    compound_assignment: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field('pattern', $._assignable_pattern),
          ':=',
          choice(
            field('value', $._compound_expression),
            seq($._indent, field('value', $._compound_expression), $._dedent),
          ),
        ),
      ),

    import: ($) => seq('import', $._import_body),
    external_import: ($) => seq('export', $._import_body),
    _import_body: ($) =>
      seq(
        commaSep1(field('import', choice($.import_identifier, $.import_type))),
        'from',
        field('source', $.string_pattern),
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

    return: ($) =>
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
        'else',
        field('else', alias($._compound_block, $.block)),
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
        compound($, repeat1(field('value', $.enum_value))),
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
        compound($, repeat1(field('member', $.member_type))),
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

    struct: ($) =>
      prec(
        PREC.EXPRESSION,
        struct(
          $,
          choice($.member, alias($.identifier, $.shorthand_member), $.spread),
        ),
      ),
    tuple: ($) => prec(PREC.EXPRESSION, tuple($, $.tuple_element)),
    list: ($) =>
      prec(PREC.EXPRESSION, list($, choice($._simple_expression, $.spread))),
    member: ($) => member($, $._simple_expression, $._simple_expression),
    tuple_element: ($) =>
      prec.left(
        choice(
          field('placeholder', '?'),
          field('value', choice($._simple_expression, $.spread)),
        ),
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

    named_value: ($) =>
      prec.right(
        seq(field('name', $.type), field('value', $._simple_expression)),
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
        $.named_type,
        alias($.identifier, $.type_variable),
      ),
    type_group: ($) => seq('(', field('type', $._type_constructor), ')'),
    typeof: ($) =>
      seq('typeof', field('value', choice($.identifier, $._value_literal))),
    parametric_type: ($) => prec.right(parametricType($, $._type_constructor)),
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
    member_type: ($) => member($, $._type_constructor, $._type_constructor),
    tuple_type: ($) => tuple($, $._type_constructor),
    list_type: ($) => seq('[', field('element', $._type_constructor), ']'),

    named_type: ($) =>
      prec(
        PREC.NAMED_TYPE,
        seq(field('name', $.type), field('type', $._type_constructor)),
      ),

    type_declaration: ($) =>
      seq(
        optional(seq(commaSep1(field('dependency', $.parametric_type)), '=>')),
        parametricType($, alias($.identifier, $.type_variable)),
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
      string(
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
