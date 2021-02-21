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

  _type_constructor: (dialect) => ($) => {
    const choices = [
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
      $.optional_type,
      $.tagged_type,
      $.labeled_type,
      $.keyof,
      alias($.identifier, $.type_variable),
      $.type_group,
    ]

    if (dialect === 'tony')
      choices.push(
        $.typeof,
        $.access_type,
        $.refinement_type,
        $.refinement_type_declaration,
      )

    return prec.left(choice(...choices))
  },

  _term_type: ($) => choice($.identifier, $._literal),

  typeof_: ($) => seq('typeof', field('value', $._term_type)),

  parametric_type_constructor: (dialect) => ($) => {
    const nodes = [
      field('name', $.type),
      optional(buildGenericType('argument', $._type)),
    ]

    if (dialect === 'tony')
      nodes.push(optional(buildTuple($, $._term_type, false, true)))

    return prec.right(seq(...nodes))
  },

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
        'if',
        field('type', $._type),
        buildTypeConstraint($),
        'then',
        field('consequence', $._type),
        'else',
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
      optional(
        seq(
          field(
            'property',
            alias($.identifier, $.type_variable_declaration_name),
          ),
          'in',
        ),
      ),
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
      seq(field('type', $._type), '[', field('value', $._term_type), ']'),
    ),

  optional_type: ($) =>
    prec(Prec.OptionalType, seq(field('type', $._type), '?')),

  tagged_type: ($) =>
    prec.right(
      Prec.Tagged,
      seq(
        '<',
        field('name', $.identifier),
        '>',
        optional(field('type', $._type)),
      ),
    ),

  labeled_type: ($) =>
    prec(
      Prec.LabeledType,
      seq(field('label', $.identifier), ':', field('type', $._type)),
    ),

  keyof: ($) => prec.right(seq('keyof', field('type', $._type))),

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
        optional(
          seq(
            '<',
            field('tag', alias($.identifier, $.identifier_pattern_name)),
            '>',
          ),
        ),
        field('name', $.type),
        optional(buildGenericType('parameter', $.type_variable_declaration)),
        optional(buildTuple($, $.identifier_pattern, false, true)),
      ),
    ),

  type_group: ($) => seq('(', field('type', $._type), ')'),

  type: () => /[A-Z][a-zA-Z0-9]*/,
}
