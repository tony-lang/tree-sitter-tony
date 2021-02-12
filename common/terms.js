const Constants = require('./constants')
const Prec = require('./precedence')
const {
  commaSep1,
  buildSimpleBlock,
  buildCompoundBlock,
  buildTuple,
  buildStruct,
  buildList,
  buildMember,
  buildAbstractionBranch,
  buildGenericType,
} = require('./util')

module.exports = {
  _term: ($) => choice(seq($._simple_term, $._newline), $._compound_term),
  _simple_term: ($) =>
    prec.left(
      Prec.Term,
      choice(
        alias($.simple_abstraction, $.abstraction),
        $.application,
        $.prefix_application,
        $.infix_application,
        $._section,
        $.pipeline,
        $.access,
        alias($.simple_assignment, $.assignment),
        alias($.simple_export, $.export),
        $.return,
        alias($.simple_if, $.if),
        $.struct,
        $.tuple,
        $.list,
        $.list_comprehension,
        $.tagged_value,
        $.type_alias,
        $.type_hint,
        $.identifier,
        $._literal,
        $.group,
      ),
    ),
  _compound_term: ($) =>
    prec.left(
      Prec.Term,
      choice(
        alias($.compound_abstraction, $.abstraction),
        alias($.compound_assignment, $.assignment),
        alias($.compound_export, $.export),
        alias($.compound_if, $.if),
        $.case,
        $.enum,
        $.class,
        $.instance,
      ),
    ),

  _simple_block: ($) => prec.left(field('term', $._simple_term)),
  _compound_block: ($) =>
    prec.left(
      choice(
        buildSimpleBlock($, field('term', $._simple_term)),
        buildCompoundBlock($, repeat1(field('term', $._term))),
      ),
    ),

  simple_export: ($) =>
    seq(
      'export',
      field('declaration', alias($.simple_assignment, $.assignment)),
    ),
  compound_export: ($) =>
    seq(
      'export',
      field('declaration', alias($.compound_assignment, $.assignment)),
    ),

  simple_assignment: ($) =>
    seq(
        field('pattern', $._assignable_pattern),
        ':=',
        field('value', $._simple_term),
      ),
  compound_assignment: ($) =>
    seq(
        field('pattern', $._assignable_pattern),
        ':=',
        choice(
          field('value', $._compound_term),
          seq($._indent, field('value', $._compound_term), $._dedent),
        ),
      ),

  enum_: ($) =>
    seq(
      'enum',
      field('name', $.type),
      buildCompoundBlock($, repeat1(field('value', $.enum_value))),
    ),
  enum_value: ($) =>
    seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      optional(seq('=', field('value', $._literal))),
    ),

  class_: ($) =>
    seq(
      'class',
      field('name', $.type_declaration),
      buildCompoundBlock($, repeat1(field('member', $.class_member))),
    ),
  class_member: ($) =>
    seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      '::',
      field('type', $._type),
    ),

  instance: ($) =>
    seq(
      'instance',
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
        field('name', $._simple_term),
        optional(buildGenericType('typeArgument', $.parametric_type)),
        buildTuple($, $.argument, false, true),
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

  _section: ($) => choice($.left_section, $.right_section),
  left_section: ($) =>
    seq('(', field('value', $._simple_term), $._section_identifier, ')'),
  right_section: ($) =>
    seq('(', $._section_identifier, field('value', $._simple_term), ')'),
  _section_identifier: ($) =>
    prec(
      Prec.SectionIdentifier,
      choice(
        seq('(', field('name', alias($._operator, $.identifier)), ')'),
        seq(
          '`',
          field('name', alias($._identifier_without_operators, $.identifier)),
          '`',
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
        repeat(field('elseIf', $.else_if)),
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
      buildStruct(
        $,
        choice($.member, alias($.identifier, $.shorthand_member), $.spread),
      ),
    ),
  member: ($) => buildMember($, $._simple_term, $._simple_term),

  tuple: ($) => prec(Prec.Term, buildTuple($, $._element)),

  list: ($) => prec(Prec.Term, buildList($, $._element)),

  _element: ($) => choice($._simple_term, $.spread),
  spread: ($) => seq('...', field('value', $._simple_term)),

  tagged_value: ($) =>
    prec.right(
      Prec.Tagged,
      seq(
        '<',
        field('name', $.identifier),
        '>',
        optional(field('value', $._simple_term)),
      ),
    ),

  type_alias: ($) =>
    prec.right(
      seq(
        'type',
        field('name', $.type_declaration),
        ':=',
        field('type', $._type),
      ),
    ),

  type_hint: ($) =>
    prec.left(
      Prec.TypeHint,
      seq(field('value', $._simple_term), 'as', field('type', $._type)),
    ),

  _identifier_without_operators: () => Constants.IDENTIFIER,
  _operator: () => Constants.OPERATOR,
  identifier: ($) => choice($._operator, $._identifier_without_operators),

  group: ($) => seq('(', field('term', $._simple_term), ')'),
}
