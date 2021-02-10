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
      field('name', alias($.identifier, $.identifier_pattern_name)),
      '::',
      field('type', $._type),
    ),
}
