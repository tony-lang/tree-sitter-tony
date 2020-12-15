const Prec = require('./precedence')
const { buildString } = require('./util')

module.exports = {
  _literal: ($) =>
    prec(Prec.Literal, choice($.boolean, $.number, $.string, $.regex)),

  boolean: () => choice('false', 'true'),

  _decimal: () => {
    const digits = repeat1(/_?[0-9]+/)
    const exponent = seq(/e-?/, digits)

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
        seq('0x', repeat1(/_?[A-Fa-f0-9]+/)),
        seq('0o', repeat1(/_?[0-7]+/)),
        seq('0b', repeat1(/_?[0-1]+/)),
        seq(repeat1(/_?[0-9]+/)),
      ),
    ),
  number: ($) => choice($._decimal, $._integer),

  raw_string: ($) => buildString($),
  string: ($) =>
    buildString(
      $,
      field('interpolation', $.interpolation),
      field('escape_sequence', $.escape_sequence),
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
