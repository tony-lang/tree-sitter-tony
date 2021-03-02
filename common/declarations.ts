import { buildCompoundBlock } from './util'

export const declaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'declare',
    field('name', $.raw_string),
    buildCompoundBlock($, repeat1(field('member', $.declaration_member))),
  )

export const declaration_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    '::',
    field('type', $._type),
  )
