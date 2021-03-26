import { JS_ALPHA, JS_ALPHANUMERIC } from './constants'
import { buildBlock } from './util'

export const declaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'declare',
    field('name', $.raw_string),
    buildBlock($, field('member', $.declaration_member)),
  )

export const declaration_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('as', alias($.identifier, $.identifier_pattern_name)),
    optional(
      seq(
        'from',
        field('name', alias($.js_identifier, $.identifier_pattern_name)),
      ),
    ),
    ':',
    field('type', $._term),
  )

export const js_identifier = () => token(seq(JS_ALPHA, repeat(JS_ALPHANUMERIC)))
