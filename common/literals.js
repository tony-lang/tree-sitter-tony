const Constants = require('./constants')
const Prec = require('./precedence')
const { buildString } = require('./util')

module.exports = {
  _literal: ($) =>
    prec(Prec.Literal, choice($.boolean, $.number, $.string, $.regex)),

  boolean: () => choice('false', 'true'),

  _decimal: () => {
    const digits = repeat1(Constants.DIGITS)
    const exponent = seq(Constants.EXP, digits)

    return token(
      choice(
        seq(digits, '.', digits, optional(exponent)),
        seq(digits, exponent),
      ),
    )
  },
  _integer: () =>
    token(
      choice(
        seq('0x', repeat1(Constants.HEX)),
        seq('0o', repeat1(Constants.OCT)),
        seq('0b', repeat1(Constants.BIN)),
        seq(repeat1(Constants.DIGITS)),
      ),
    ),
  number: ($) => choice($._decimal, $._integer),

  raw_string: ($) => buildString($),
  string: ($) =>
    buildString(
      $,
      field('interpolation', $.interpolation),
      field('escapeSequence', $.escape_sequence),
    ),
  interpolation: ($) => seq('{', field('term', $._simple_term), '}'),
  escape_sequence: () =>
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
    ),

  regex: ($) =>
    seq(
      'r/',
      field('pattern', $.regex_pattern),
      '/',
      optional(field('flags', $.regex_flags)),
    ),
  regex_pattern: () =>
    token.immediate(
      repeat1(
        choice(
          seq('[', repeat(choice(seq('\\', /./), /[^\]\n\\]/)), ']'),
          seq('\\', /./),
          /[^/\\\[\n]/, // eslint-disable-line no-useless-escape
        ),
      ),
    ),
  regex_flags: () => token.immediate(/[a-z]+/),
}
