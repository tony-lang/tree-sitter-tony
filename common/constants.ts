// numbers
export const DIGITS = /_?[0-9]+/
export const EXP = /e-?/
export const HEX = /_?[A-Fa-f0-9]+/
export const OCT = /_?[0-7]+/
export const BIN = /_?[0-1]+/

// identifiers
export const IDENTIFIER = /_?[a-z][a-z0-9_]*(\?|!)?/
export const OPERATOR = /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=?]*/
export const TYPE = /[A-Z][a-zA-Z0-9]*/
