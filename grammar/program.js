const Prec = require('./precedence')
const { commaSep1 } = require('./util')

module.exports = {
  program: ($) =>
    seq(
      optional(field('hashBangLine', $.hash_bang_line)),
      repeat(field('import', choice($.import, $.exported_import))),
      repeat(field('term', $._term)),
    ),
  hash_bang_line: () => /#!.*/,

  import_: ($) => seq('import', $._import_body),
  exported_import: ($) => seq('export', $._import_body),
  _import_body: ($) =>
    prec.left(
      Prec.Pattern,
      seq(
        choice(
          field('default', alias($.identifier, $.identifier_pattern_name)),
          seq(
            optional(
              seq(
                field(
                  'default',
                  alias($.identifier, $.identifier_pattern_name),
                ),
                ',',
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
      ),
    ),
  import_identifier: ($) =>
    seq(
      optional(
        seq(
          field('name', alias($.identifier, $.identifier_pattern_name)),
          'as',
        ),
      ),
      field('as', $.identifier_pattern),
    ),
  import_type: ($) =>
    seq(field('name', $.type), optional(seq('as', field('as', $.type)))),

  comment: () => token(seq('#', /.*/)),
}
