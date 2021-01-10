const Prec = require('./precedence')
const {
  buildGenericType,
  commaSep1,
  buildStruct,
  buildTuple,
  buildTypeConstraint,
} = require('./util')

module.exports = {
  type_variable_declaration: ($) =>
    prec.left(
      seq(
        field('name', alias($.identifier, $.type_variable_declaration_name)),
        optional(buildTypeConstraint($)),
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
        $.subtraction_type,
        $.conditional_type,
        $.struct_type,
        $.map_type,
        $.tuple_type,
        $.list_type,
        $.access_type,
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

  subtraction_type: ($) =>
    prec.right(
      Prec.SubtractionType,
      seq(
        field(
          'left',
          choice(
            $.parametric_type,
            alias($.identifier, $.type_variable),
            $.union_type,
          ),
        ),
        '\\',
        field(
          'right',
          choice(
            $.parametric_type,
            alias($.identifier, $.type_variable),
            $.union_type,
          ),
        ),
      ),
    ),

  conditional_type: ($) =>
    prec.right(
      seq(
        field('type', $._type),
        buildTypeConstraint($),
        '?',
        field('consequence', $._type),
        ':',
        field('alternative', $._type),
      ),
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

  access_type: ($) =>
    prec(
      Prec.Access,
      seq(field('type', $._type), '[', field('value', $._simple_term), ']'),
    ),

  tagged_type: ($) =>
    prec.right(
      Prec.Tagged,
      seq(
        '<',
        field('name', alias($.identifier, $.identifier_pattern_name)),
        '>',
        optional(field('type', $._type)),
      ),
    ),

  refinement_type_declaration: ($) =>
    prec.left(
      seq(
        field('name', alias($.identifier, $.identifier_pattern_name)),
        ':',
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
