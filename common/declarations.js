const Constants = require('./constants')
const { buildCompoundBlock } = require('./util')

module.exports = {
  declaration: ($) =>
    seq(
      'declare',
      field('name', $.raw_string),
      buildCompoundBlock($, repeat1(field('member', $.declaration_member))),
    ),
  declaration_member: ($) =>
    seq(
      optional(
        seq(
          field('name', alias($.js_identifier, $.identifier_pattern_name)),
          'as',
        ),
      ),
      field('as', alias($.identifier, $.identifier_pattern_name)),
      '::',
      field('type', $._type),
    ),

  js_identifier: () =>
    token(seq(Constants.JS_ALPHA, repeat(Constants.JS_ALPHANUMERIC))),
}
