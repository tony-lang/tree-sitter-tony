// numbers
export const DIGITS = /_?[0-9]+/
export const EXP = /e-?/
export const HEX = /_?[A-Fa-f0-9]+/
export const OCT = /_?[0-7]+/
export const BIN = /_?[0-1]+/

// identifiers
export const IDENTIFIER = /_?[a-z][a-z0-9_]*(\?|!)?'*/
export const OPERATOR = /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=?]*/
export const TYPE = /[A-Z][a-zA-Z0-9]*/

// declarations
export const JS_ALPHA =
  /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/ // eslint-disable-line no-control-regex, no-useless-escape
export const JS_ALPHANUMERIC =
  /[^\x00-\x1F\s:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/ // eslint-disable-line no-control-regex, no-useless-escape
