const Prec = require('./precedence')
const {
  buildGenericType,
  commaSep1,
  buildStruct,
  buildTuple,
  sep2,
} = require('./util')

module.exports = {
  type_variable_declaration: ($) =>
    prec.left(
      seq(
        field('name', alias($.identifier, $.type_variable_declaration_name)),
        optional(
          seq(
            '<:',
            choice(
              field('constraint', $._type),
              seq('(', sep2(';')(field('constraint', $._type)), ')'),
            ),
          ),
        ),
      ),
    ),

  _type: ($) =>
    prec.left(
      choice(
        $.typeof,
        $.parametric_type,
        $.curried_type,
        $.intersection_type,
        $.union_type,
        $.struct_type,
        $.map_type,
        $.tuple_type,
        $.list_type,
        $.tagged_type,
        $.refinement_type,
        $.refinement_type_declaration,
        alias($.identifier, $.type_variable),
        $.type_group,
      ),
    ),

  typeof_: ($) =>
    seq('typeof', field('value', choice($.identifier, $._literal))),

  parametric_type: ($) =>
    prec.right(
      seq(
        field('name', $.type),
        optional(buildGenericType('argument', $._type)),
        optional(buildTuple($, $._literal, false, true)),
      ),
    ),

  curried_type: ($) =>
    prec.right(
      Prec.CurriedType,
      seq(field('from', $._type), '->', field('to', $._type)),
    ),

  intersection_type: ($) =>
    prec.right(
      Prec.IntersectionType,
      seq(field('left', $._type), '&', field('right', $._type)),
    ),

  union_type: ($) =>
    prec.right(
      Prec.UnionType,
      seq(field('left', $._type), '|', field('right', $._type)),
    ),

  struct_type: ($) => buildStruct($, $.member_type),
  member_type: ($) =>
    seq(
      field('key', alias($.identifier, $.shorthand_member_identifier)),
      ':',
      field('value', $._type),
    ),

  map_type: ($) =>
    seq(
      '{',
      '[',
      field('key', $._type),
      ']',
      ':',
      field('value', $._type),
      '}',
    ),

  tuple_type: ($) => buildTuple($, $._type),

  list_type: ($) => seq('[', field('element', $._type), ']'),

  tagged_type: ($) =>
    prec(
      Prec.TaggedType,
      seq(
        field('name', alias($.identifier, $.identifier_pattern_name)),
        ':',
        field('type', $._type),
      ),
    ),

  refinement_type_declaration: ($) =>
    prec.left(
      seq(
        field('name', alias($.identifier, $.identifier_pattern_name)),
        '::',
        field('type', $._type),
      ),
    ),
  refinement_type: ($) =>
    seq(
      '[',
      field('generator', $._type),
      '|',
      commaSep1(field('predicate', $._predicate)),
      ']',
    ),
  _predicate: ($) =>
    choice(
      $.application,
      $.infix_application,
      $.prefix_application,
      $.pipeline,
    ),

  type_declaration: ($) =>
    prec.left(
      seq(
        field('name', $.type),
        optional(buildGenericType('parameter', $.type_variable_declaration)),
        optional(buildTuple($, $.identifier_pattern, false, true)),
      ),
    ),

  type_group: ($) => seq('(', field('type', $._type), ')'),

  type: () => /[A-Z][a-zA-Z0-9]*/,
}
