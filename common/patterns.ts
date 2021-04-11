import { Prec } from './precedences'
import {
  buildBindingPattern,
  buildList,
  buildMember,
  buildStruct,
  buildTuple,
} from './util'

export const _pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    choice(
      $.wildcard_pattern,
      $.binding_pattern,
      $._assignable_pattern,
      $._literal_pattern,
    ),
  )

export const _assignable_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    choice(
      alias($.root_binding_pattern, $.binding_pattern),
      $.destructuring_pattern,
      $.pattern_group,
    ),
  )

export const destructuring_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      optional(
        seq(
          field(
            'alias',
            choice(
              alias($.identifier, $.identifier_pattern),
              alias($.type, $.type_pattern),
            ),
          ),
          '@',
        ),
      ),
      field(
        'pattern',
        choice(
          $.struct_pattern,
          $.tuple_pattern,
          $.list_pattern,
          $.tag_pattern,
        ),
      ),
    ),
  )

export const struct_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    buildStruct(
      $,
      'member',
      choice(
        $.member_pattern,
        alias($.binding_pattern, $.shorthand_member_pattern),
      ),
      true,
    ),
  )

export const member_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildMember($, $._term, $._pattern))

export const tuple_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildTuple($, 'element', $._pattern, true, false))

export const list_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildList($, 'element', $._pattern, true))

export const binding_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildBindingPattern($, true))

export const root_binding_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', choice(buildBindingPattern($, false)))

export const wildcard_pattern = () => '_'

export const tag_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'application',
    seq(
      field('name', alias($._identifier_without_operators, $.identifier)),
      field('pattern', $._pattern),
    ),
  )

export const _literal_pattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec('base', choice($.boolean, $.decimal, $.integer, $.raw_string, $.regex))

export const pattern_group = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', seq('(', field('pattern', $._pattern), ')'))
