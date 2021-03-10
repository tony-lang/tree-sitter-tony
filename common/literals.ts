import { BIN, DIGITS, EXP, HEX, OCT } from './constants'
import { Prec } from './enums'
import { buildString } from './util'

export const _literal = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Literal, choice($.boolean, $.number, $.string, $.regex))

export const boolean = () => choice('false', 'true')

export const _decimal = () => {
  const digits = repeat1(DIGITS)
  const exponent = seq(EXP, digits)

  return token(
    choice(seq(digits, '.', digits, optional(exponent)), seq(digits, exponent)),
  )
}

export const _integer = () =>
  token(
    choice(
      seq('0x', repeat1(HEX)),
      seq('0o', repeat1(OCT)),
      seq('0b', repeat1(BIN)),
      seq(repeat1(DIGITS)),
    ),
  )

export const number = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  choice($._decimal, $._integer)

export const raw_string = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildString($)

export const string = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildString(
    $,
    field('interpolation', $.interpolation),
    field('escapeSequence', $.escape_sequence),
  )

export const interpolation = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('{', field('term', $._simple_term), '}')

export const escape_sequence = () =>
  token.immediate(
    seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u{[0-9a-fA-F]+}/,
      ),
    ),
  )

export const regex = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'r/',
    field('pattern', $.regex_pattern),
    '/',
    optional(field('flags', $.regex_flags)),
  )

export const regex_pattern = () =>
  token.immediate(
    repeat1(
      choice(
        seq('[', repeat(choice(seq('\\', /./), /[^\]\n\\]/)), ']'),
        seq('\\', /./),
        /[^/\\\[\n]/, // eslint-disable-line no-useless-escape
      ),
    ),
  )

export const regex_flags = () => token.immediate(/[a-z]+/)
