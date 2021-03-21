import {
  buildGenericType,
  buildList,
  buildMember,
  buildStruct,
  buildTuple,
} from './util'
import { Prec } from './enums'

export const _pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Pattern, choice($._assignable_pattern, $._literal_pattern))

export const _assignable_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  choice(
    $.identifier_pattern,
    $.destructuring_pattern,
    $.tagged_pattern,
    $.pattern_group,
  )

export const destructuring_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.Pattern,
    seq(
      optional(buildGenericType('typeParameter', $.type_variable_declaration)),
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
  )

export const struct_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
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
  )

export const member_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildMember($, $._simple_term, $._pattern)

export const tuple_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Pattern, buildTuple($, $._pattern, true))

export const list_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Pattern, buildList($, $._pattern, true))

export const identifier_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Pattern,
    seq(
      field('name', alias($.identifier, $.identifier_pattern_name)),
      optional(buildGenericType('typeParameter', $.type_variable_declaration)),
      optional(seq('::', field('type', $._type))),
      optional(seq('=', field('default', $._simple_term))),
    ),
  )

export const tagged_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    ':',
    field('name', alias($._identifier_without_operators, $.identifier)),
    field('pattern', $._pattern),
  )

export const _literal_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($.boolean, $.number, $.raw_string, $.regex)

export const pattern_group = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Pattern, seq('(', field('pattern', $._pattern), ')'))
