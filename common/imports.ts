import { Dialect } from './dialects'
import { commaSep1 } from './util'

export const import_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('import', $._import_body)

export const exported_import = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('export', $._import_body)

export const _import_body_constructor = (dialect: Dialect) => <
  RuleName extends string
>(
  $: GrammarSymbols<RuleName>,
) => {
  switch (dialect) {
    case Dialect.DTN:
      return prec.left(
        seq(
          '{',
          commaSep1(field('import', $.import_type)),
          '}',
          'from',
          field('source', $.raw_string),
        ),
      )
    case Dialect.Tony:
      return prec.left(
        seq(
          choice(
            field('default', alias($.identifier, $.identifier_pattern)),
            seq(
              optional(
                seq(
                  field('default', alias($.identifier, $.identifier_pattern)),
                  ',',
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
        )
    }
  }

export const import_identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    optional(
      seq(field('name', alias($.identifier, $.identifier_pattern)), 'as'),
    ),
    field('as', alias($.identifier, $.identifier_pattern)),
  )

export const import_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq(optional(seq(field('name', $.type), 'as')), field('as', $.type))
