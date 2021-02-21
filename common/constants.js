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

  // declarations
  JS_ALPHA: /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/, // eslint-disable-line no-control-regex, no-useless-escape
  JS_ALPHANUMERIC: /[^\x00-\x1F\s:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/, // eslint-disable-line no-control-regex, no-useless-escape
}
