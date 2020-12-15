const Prec = require('./precedence')
const { buildStruct, buildTuple, buildList, buildMember } = require('./util')

module.exports = {
  _pattern: ($) =>
    prec(Prec.Pattern, choice($._assignable_pattern, $._literal_pattern)),

  _assignable_pattern: ($) =>
    choice(
      $.pattern_group,
      $.identifier_pattern,
      $.destructuring_pattern,
      $.named_pattern,
    ),

  destructuring_pattern: ($) =>
    prec(
      Prec.Pattern,
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
    ),
  struct_pattern: ($) =>
    prec(
      Prec.Pattern,
      buildStruct(
        $,
        choice(
          $.member_pattern,
          alias($.identifier_pattern, $.shorthand_member_pattern),
        ),
        true,
      ),
    ),
  tuple_pattern: ($) => prec(Prec.Pattern, buildTuple($, $._pattern, true)),
  list_pattern: ($) => prec(Prec.Pattern, buildList($, $._pattern, true)),
  member_pattern: ($) => buildMember($, $._simple_expression, $._pattern),
  rest: ($) => seq('...', field('name', $.identifier_pattern)),

  identifier_pattern: ($) =>
    prec.right(
      Prec.Pattern,
      seq(
        field('name', alias($.identifier, $.identifier_pattern_name)),
        optional(seq('::', field('type', $._type))),
        optional(seq('=', field('default', $._simple_expression))),
      ),
    ),

  named_pattern: ($) =>
    prec(
      Prec.Pattern,
      seq(
        field('name', alias($.identifier, $.constructor)),
        ':',
        field('pattern', $._pattern),
      ),
    ),

  _literal_pattern: ($) => choice($.boolean, $.number, $.raw_string, $.regex),

  pattern_group: ($) =>
    prec(Prec.Pattern, seq('(', field('pattern', $._pattern), ')')),
}
