const PREC = Object.freeze({
  REGEX: -1,
  NAMED_INFIX: 1,
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
  ACCESS: 18
});

module.exports = grammar({
  name: 'tony',

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,
    $._string_start,
    $._string_content,
    $._string_end
  ],
  extras: $ => [$.comment, /\s+/],
  word: $ => $._identifier_without_operators,
  conflicts: $ => [
    [$.infix_application],
    [$._simple_expression, $.pattern],
    [$._literal, $._literal_pattern],
    [$.string, $.string_pattern],
    [$.shorthand_pair_identifier_pattern, $.map]
  ],

  rules: {
    program: $ => seq(
      optional($.hash_bang_line),
      optional(repeat1($._statement)),
    ),
    hash_bang_line: $ => /#!.*/,

    _statement: $ => choice(
      seq($._simple_statement, $._newline),
      $._compound_statement
    ),
    _simple_statement: $ => choice(
      $.import,
      $.external_import,
      alias($.simple_export, $.export),
      $._simple_expression
    ),
    _compound_statement: $ => choice(
      alias($.compound_export, $.export),
      $._compound_expression
    ),

    import: $ => seq(
      'import',
      field('clause', $.import_clause),
      'from',
      field('source', $.string)
    ),
    import_clause: $ => seq(
      '{',
      commaSep1(choice(
        alias($.identifier, $.identifier_pattern_name),
        $.import_clause_identifier_pair
      )),
      '}'
    ),
    import_clause_identifier_pair: $ => seq(
      field('left', alias($.identifier, $.identifier_pattern_name)),
      ':',
      field('right', alias($.identifier, $.identifier_pattern_name))
    ),

    external_import: $ => seq(
      'import',
      'extern',
      field('clause', $.external_import_clause),
      'from',
      field('source', $.string)
    ),
    external_import_clause: $ => seq(
      '{',
      commaSep1(choice(
        $.identifier_pattern,
        $.external_import_clause_identifier_pair
      )),
      '}'
    ),
    external_import_clause_identifier_pair: $ => seq(
      field('left', alias($.identifier, $.identifier_pattern_name)),
      ':',
      field('right', $.identifier_pattern)
    ),

    simple_export: $ => seq(
      'export',
      field('declaration', $._simple_declaration)
    ),
    compound_export: $ => seq(
      'export',
      field('declaration', $._compound_declaration)
    ),

    _expression: $ => choice(
      seq($._simple_expression, $._newline),
      $._compound_expression
    ),
    _simple_expression: $ => prec.left(PREC.EXPRESSION, choice(
      $._group,
      alias($.simple_abstraction, $.abstraction),
      $.application,
      $.prefix_application,
      $.infix_application,
      $.pipeline,
      $.access,
      alias($.simple_assignment, $.assignment),
      $.return,
      alias($.simple_if, $.if),
      $.map,
      $.tuple,
      $.list,
      $.list_comprehension,
      $.identifier,
      $._literal
    )),
    _compound_expression: $ => choice(
      alias($.compound_abstraction, $.abstraction),
      alias($.compound_assignment, $.assignment),
      alias($.compound_if, $.if),
      $.case,
      $.module
    ),

    _simple_declaration: $ => choice(
      alias($.simple_assignment, $.assignment)
    ),
    _compound_declaration: $ => choice(
      alias($.compound_assignment, $.assignment),
      $.module
    ),

    block: $ => choice(
      seq($._simple_expression, $._newline),
      seq($._newline, $._indent, repeat1($._expression), $._dedent)
    ),

    pattern: $ => prec(PREC.PATTERN, choice(
      field('pattern', $._destructuring_pattern),
      field('value', $._literal_pattern),
      seq(
        field('name', $.identifier_pattern),
        optional(seq('=', field('value', $._simple_expression)))
      )
    )),

    _destructuring_pattern: $ => prec(PREC.PATTERN, choice(
      $.map_pattern,
      $.tuple_pattern,
      $.list_pattern
    )),
    map_pattern: $ => prec(PREC.PATTERN, seq(
      '{',
      commaSep(choice($.pattern_pair, $.shorthand_pair_identifier_pattern)),
      optional(seq(',', alias($.rest, $.rest_map))),
      '}'
    )),
    tuple_pattern: $ => prec(PREC.PATTERN, choice(
      seq('(', $.pattern, ',', alias($.rest, $.rest_list), ')'),
      seq(
        '(',
        commaSep2($.pattern),
        optional(seq(',', alias($.rest, $.rest_list))),
        ')'
      )
    )),
    list_pattern: $ => prec(PREC.PATTERN, seq(
      '[',
      commaSep($.pattern),
      optional(seq(',', alias($.rest, $.rest_list))),
      ']'
    )),
    pattern_pair: $ => seq(
      field('left', alias($.identifier, $.identifier_pattern_name)),
      ':',
      field('right', $.pattern)
    ),
    shorthand_pair_identifier_pattern: $ => seq(
      field('name', $.identifier_pattern),
      optional(seq('=', field('value', $._simple_expression)))
    ),
    rest: $ => seq(
      '...',
      field('name', $.identifier_pattern)
    ),

    _literal_pattern: $ => choice(
      $.type,
      $.boolean,
      $.number,
      $.string_pattern,
      prec(PREC.REGEX, $.regex)
    ),
    string_pattern: $ => seq(
      $._string_start,
      repeat(choice($.escape_sequence, $._string_content)),
      $._string_end
    ),

    identifier_pattern: $ => seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      '::',
      field('type', $.type_constructor)
    ),

    parameters: $ => seq(
      '(',
      optional(choice(
        seq(
          commaSep1($.pattern),
          optional(seq(',', alias($.rest, $.rest_list))),
        ),
        alias($.rest, $.rest_list)
      )),
      ')'
    ),

    argument: $ => prec.left(choice('?', field('value', $._simple_expression))),
    arguments: $ => commaSep1($.argument),

    _group: $ => seq('(', $._simple_expression, ')'),

    simple_abstraction: $ => prec.left(commaSep1(
      alias($.simple_abstraction_branch, $.abstraction_branch)
    )),
    simple_abstraction_branch: $ => prec.left(seq(
      field('parameters', $.parameters),
      '=>',
      field('body', $._simple_expression)
    )),
    compound_abstraction: $ => prec.left(repeat1(
      alias($.compound_abstraction_branch, $.abstraction_branch)
    )),
    compound_abstraction_branch: $ => prec.left(seq(
      field('parameters', $.parameters),
      '=>',
      field('body', $.block)
    )),

    application: $ => prec(PREC.APPLICATION, seq(
      field('abstraction', $._simple_expression),
      '(',
      field('arguments', $.arguments),
      ')'
    )),
    prefix_application: $ => prec.right(PREC.PREFIX, seq(
      field('abstraction', alias($._operator, $.identifier)),
      field('argument', $._simple_expression)
    )),
    infix_application: $ => choice(
      prec.left(PREC.NOT, seq(field('left', $._simple_expression), field('abstraction', alias('!', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.EXPONENTIATION, seq(field('left', $._simple_expression), field('abstraction', alias('^', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._simple_expression), field('abstraction', alias('*', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._simple_expression), field('abstraction', alias('/', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.SUM, seq(field('left', $._simple_expression), field('abstraction', alias('+', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.SUM, seq(field('left', $._simple_expression), field('abstraction', alias('-', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.MOD, seq(field('left', $._simple_expression), field('abstraction', alias('%', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', alias('<', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', alias('<=', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', alias('>', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', alias('>=', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', alias('==', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', alias('!=', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', alias('===', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', alias('!==', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.AND, seq(field('left', $._simple_expression), field('abstraction', alias('&&', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.OR, seq(field('left', $._simple_expression), field('abstraction', alias('||', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.IMPLICATION, seq(field('left', $._simple_expression), field('abstraction', alias('==>', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.BICONDITIONAL, seq(field('left', $._simple_expression), field('abstraction', alias('<=>', $.infix_application_operator)), field('right', $._simple_expression))),
      prec.left(PREC.OPERATOR_INFIX, seq(
        field('left', $._simple_expression),
        field('abstraction', alias($._operator, $.infix_application_operator)),
        field('right', $._simple_expression))
      ),
      prec.left(PREC.NAMED_INFIX, seq(
        field('left', $._simple_expression),
        '`',
        field('abstraction', alias($._identifier_without_operators, $.infix_application_operator)),
        '`',
        field('right', $._simple_expression))
      )
    ),

    pipeline: $ => prec.left(PREC.PIPELINE, seq(
      field('left', $._simple_expression),
      '.',
      field('right', $._simple_expression)
    )),

    access: $ => prec.left(PREC.ACCESS, seq(
      field('left', $._simple_expression),
      choice(
        seq('[', field('right', $._simple_expression), ']'),
        seq('->', field('right', alias($.identifier, $.shorthand_access_identifier)))
      )
    )),

    simple_assignment: $ => seq(
      field('left', choice(
        $.identifier_pattern,
        $._destructuring_pattern
      )),
      ':=',
      field('right', $._simple_expression)
    ),
    compound_assignment: $ => seq(
      field('left', choice(
        $.identifier_pattern,
        $._destructuring_pattern
      )),
      ':=',
      choice(
        field('right', $._compound_expression),
        seq(
          $._indent,
          field('right', $._compound_expression),
          $._dedent
        )
      )
    ),

    return: $ => prec.right(seq(
      'return',
      optional(field('value', $._simple_expression))
    )),

    simple_if: $ => prec.right(seq(
      'if',
      field('condition', $._simple_expression),
      'then',
      field('consequence', $._simple_expression),
      optional(seq('else', field('alternative', $._simple_expression)))
    )),
    compound_if: $ => prec.right(seq(
      'if',
      field('condition', $._simple_expression),
      optional('then'),
      field('consequence', $.block),
      field('alternatives', alias(repeat($.else_if_clause), $.else_if_clauses)),
      optional(seq('else', field('alternative', $.block)))
    )),
    else_if_clause: $ => seq(
      'else if',
      field('condition', $._simple_expression),
      optional('then'),
      field('consequence', $.block)
    ),

    case: $ => seq(
      'case',
      field('value', $._simple_expression),
      field('branches', alias(repeat1($.when_clause), $.when_clauses)),
      optional(seq('else', field('default', $.block)))
    ),
    when_clause: $ => seq(
      'when',
      field('values', $.pattern_list),
      optional('then'),
      field('consequence', $.block)
    ),
    pattern_list: $ => commaSep1($.pattern),

    module: $ => seq(
      'module',
      field('name', $.type),
      optional('where'),
      field('body', $.block)
    ),

    map: $ => seq(
      '{',
      commaSep(choice(
        $.expression_pair,
        alias($.identifier, $.shorthand_pair_identifier),
        $.spread
      )),
      '}'
    ),
    tuple: $ => seq('(', commaSep2(choice($._simple_expression, $.spread)), ')'),
    list: $ => seq('[', commaSep(choice($._simple_expression, $.spread)), ']'),
    expression_pair: $ => seq(
      choice(
        seq('[', field('left', $._simple_expression), ']'),
        field('left', alias($.identifier, $.shorthand_access_identifier),)
      ),
      ':',
      field('right', $._simple_expression)
    ),
    spread: $ => seq('...', field('value', $._simple_expression)),

    list_comprehension: $ => seq(
      '[',
      field('body', $._simple_expression),
      '|',
      field('generators', $.generators),
      ']'
    ),
    generators: $ => commaSep1($.generator),
    generator: $ => seq(
      field('name', $.identifier),
      'in',
      field('value', $._simple_expression),
      optional(field('condition', $.generator_condition))
    ),
    generator_condition: $ => seq('if', $._simple_expression),

    type_constructor: $ => $._curried_type,
    _curried_type: $ => prec.right(choice(
      $._atomic_type,
      seq($._atomic_type, '->', optional($._curried_type))
    )),
    _atomic_type: $ => choice(
      $._type_group,
      $.type,
      $.map_type,
      $.tuple_type,
      $.list_type
    ),
    _type_group: $ => seq('(', $.type_constructor, ')'),
    map_type: $ => seq('{', field('left', $.type_constructor), ':', field('right', $.type_constructor), '}'),
    tuple_type: $ => seq('(', commaSep2($.type_constructor), ')'),
    list_type: $ => seq('[', field('type', $.type_constructor), ']'),

    _identifier_without_operators: $ => /[a-z_][a-z0-9_]*\??/,
    _operator: $ => choice(/(==|[!@$%^&*|<>~*\\\-+/.]+)=*>?/, '/'),
    identifier: $ => choice($._operator, $._identifier_without_operators),

    _literal: $ => choice(
      $.type,
      $.boolean,
      $.number,
      $.string,
      prec(PREC.REGEX, $.regex)
    ),

    type: $ => /[A-Z][a-zA-Z0-9]*/,

    boolean: $ => choice('false', 'true'),

    _decimal: $ => {
      const digits = repeat1(/_?[0-9]+/)
      const exponent = seq(/e-?/, digits)

      return token(choice(
        seq(digits, '.', digits, optional(exponent)),
        seq(digits, exponent)
      ))
    },
    _integer: $ => token(choice(
      seq('0x', repeat1(/_?[A-Fa-f0-9]+/)),
      seq('0o', repeat1(/_?[0-7]+/)),
      seq('0b', repeat1(/_?[0-1]+/)),
      seq(repeat1(/_?[0-9]+/))
    )),
    number: $ => choice($._decimal, $._integer),

    string: $ => seq(
      $._string_start,
      repeat(choice($.interpolation, $.escape_sequence, $._string_content)),
      $._string_end
    ),
    interpolation: $ => seq(
      '{',
      field('value', $._simple_expression),
      '}'
    ),
    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u{[0-9a-fA-F]+}/
      )
    )),

    regex: $ => seq(
      '/',
      $.regex_pattern,
      token.immediate('/'),
      optional($.regex_flags)
    ),
    regex_pattern: $ => token.immediate(
      repeat1(choice(seq(
        '[',
        repeat(choice(seq('\\', /./), /[^\]\n\\]/)),
        ']'
      ), seq('\\', /./), /[^/\\\[\n]/))
    ),
    regex_flags: $ => token.immediate(/[a-z]+/),

    comment: $ => token(seq('#', /.*/))
  }
});

function commaSep2(rule) {
  return seq(rule, repeat1(seq(',', rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
