const { commaSep1 } = require('./util')

module.exports = {
  import_: ($) => seq('import', $._import_body),
  exported_import: ($) => seq('export', $._import_body),
  _import_body_constructor: (dialect) => ($) =>
    dialect === 'tony'
      ? seq(
          choice(
            field('default', alias($.identifier, $.identifier_pattern_name)),
            seq(
              optional(
                seq(
                  field(
                    'default',
                    alias($.identifier, $.identifier_pattern_name),
                  ),
                  '@',
                ),
              ),
              '{',
              commaSep1(
                field('import', choice($.import_identifier, $.import_type)),
              ),
              '}',
            ),
          ),
          'from',
          field('source', $.raw_string),
        )
      : dialect === 'dtn'
      ? seq(
          '{',
          commaSep1(field('import', $.import_type)),
          '}',
          'from',
          field('source', $.raw_string),
        )
      : undefined,
  import_identifier: ($) =>
    seq(
      optional(
        seq(
          field('name', alias($.identifier, $.identifier_pattern_name)),
          'as',
        ),
      ),
      field('as', alias($.identifier, $.identifier_pattern_name)),
    ),
  import_type: ($) =>
    seq(optional(seq(field('name', $.type), 'as')), field('as', $.type)),
}
