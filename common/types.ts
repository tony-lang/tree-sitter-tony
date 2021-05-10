import { Dialect, Prec } from './enums'
import {
  buildGenericType,
  buildStruct,
  buildTuple,
  buildTypeConstraint,
  commaSep1,
} from './util'
import { TYPE } from './constants'

export const type_variable_declaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    seq(
      field('name', alias($.type, $.type_variable_declaration_name)),
      optional(buildTypeConstraint($)),
    ),
  )

export const _type_constructor =
  (dialect: Dialect) =>
  <RuleName extends string>($: GrammarSymbols<RuleName>) => {
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
      $.type_group,
    ]

    if (dialect === Dialect.Tony)
      choices.push(
        $.typeof,
        $.access_type,
        $.refinement_type,
        $.refinement_type_declaration,
      )

    return choice(...choices)
  }

export const _term_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($.identifier, $._literal)

export const typeof_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('typeof', field('value', $._term_type))

export const parametric_type_constructor =
  (dialect: Dialect) =>
  <RuleName extends string>($: GrammarSymbols<RuleName>) => {
    const nodes = [
      field('name', $.type),
      optional(buildGenericType('argument', $._type)),
    ]

    if (dialect === Dialect.Tony)
      nodes.push(optional(buildTuple($, $._term_type, false, true, false)))

    return prec.right(seq(...nodes))
  }

export const curried_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.CurriedType,
    seq(field('from', $._type), '=>', field('to', $._type)),
  )

export const intersection_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.IntersectionType,
    seq(field('left', $._type), '&', field('right', $._type)),
  )

export const union_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.UnionType,
    seq(field('left', $._type), '|', field('right', $._type)),
  )

export const subtraction_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.SubtractionType,
    seq(
      field('left', choice($.parametric_type, $.union_type)),
      '\\',
      field('right', choice($.parametric_type, $.union_type)),
    ),
  )

export const conditional_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(
      field('type', $._type),
      buildTypeConstraint($),
      '?',
      field('consequence', $._type),
      ':',
      field('alternative', $._type),
    ),
  )

export const struct_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildStruct($, $.member_type)
export const member_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('key', alias($.identifier, $.shorthand_member_identifier)),
    ':',
    field('value', $._type),
  )

export const map_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '{',
    '[',
    optional(
      seq(
        field('property', alias($.type, $.type_variable_declaration_name)),
        'in',
      ),
    ),
    field('key', $._type),
    ']',
    ':',
    field('value', $._type),
    '}',
  )

export const tuple_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildTuple($, $._type)

export const list_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('[', field('element', $._type), ']')

export const access_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.Access,
    seq(
      field('type', $._type),
      choice(
        seq('[', field('value', $._term_type), ']'),
        seq(
          '->',
          field('value', alias($.identifier, $.shorthand_access_identifier)),
        ),
      ),
    ),
  )

export const optional_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.OptionalType, seq(field('type', $._type), '?'))

export const tagged_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.TaggedType,
    seq(
      field(
        'name',
        alias($._identifier_without_operators, $.identifier_pattern_name),
      ),
      field('type', $._type),
    ),
  )

export const labeled_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.LabeledType,
    seq(field('label', $.identifier), ':', field('type', $._type)),
  )

export const keyof = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('keyof', field('type', $._type)))

export const refinement_type_declaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      '::',
      field('type', $._type),
    ),
  )

export const refinement_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '[',
    field('generator', $._type),
    '|',
    commaSep1(field('predicate', $._predicate)),
    ']',
  )

export const _predicate = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($.application, $.infix_application)

export const type_group = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('(', field('type', $._type), ')')

export const type = () => TYPE
