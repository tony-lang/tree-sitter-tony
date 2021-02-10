module.exports = {
  // numbers
  DIGITS: /_?[0-9]+/,
  EXP: /e-?/,
  HEX: /_?[A-Fa-f0-9]+/,
  OCT: /_?[0-7]+/,
  BIN: /_?[0-1]+/,

  // identifiers
  IDENTIFIER: /_?[a-z][a-z0-9_]*(\?|!)?/,
  OPERATOR: /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=?]*/,
}
