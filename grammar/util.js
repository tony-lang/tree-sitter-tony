const notFalse = (...args) => args.filter((element) => element !== false)

const commaSep2 = (rule) => seq(rule, repeat1(seq(',', rule)))

const commaSep1 = (rule) => seq(rule, repeat(seq(',', rule)))

const buildAbstractionBranch = ($, blockType) =>
  seq(
    optional(buildGenericType($.type_variable_declaration)),
    field('parameters', $.parameters),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const buildDataStructure = ($, element, rest, commaSepImpl = commaSep1) =>
  optional(
    choice(
      ...notFalse(
        rest && field('rest', $.rest),
        seq(
          ...notFalse(
            commaSepImpl(element),
            rest && optional(seq(',', field('rest', $.rest))),
          ),
        ),
      ),
    ),
  )

const buildStruct = ($, member, rest = false) =>
  seq('{', buildDataStructure($, field('member', member), rest), '}')

const buildTuple = ($, element, rest = false, allowSingle = false) =>
  choice(
    '()',
    seq(
      '(',
      buildDataStructure(
        $,
        field('element', element),
        rest,
        allowSingle ? commaSep1 : commaSep2,
      ),
      ')',
    ),
  )

const buildList = ($, element, rest = false) =>
  seq('[', buildDataStructure($, field('element', element), rest), ']')

const buildMember = ($, key, value) =>
  seq(
    choice(
      seq('[', field('key', key), ']'),
      field('key', alias($.identifier, $.shorthand_member_identifier)),
    ),
    ':',
    field('value', value),
  )

const buildString = ($, ...content) =>
  seq(
    $._string_start,
    repeat(choice(...content, $._string_content)),
    $._string_end,
  )

const buildGenericType = (parameter) =>
  seq('<', commaSep1(field('parameter', parameter)), '>')

const buildParametricType = ($, parameter) =>
  seq(field('name', $.type), optional(buildGenericType(parameter)))

const buildSimpleBlock = ($, line) => seq(line, $._newline)

const buildCompoundBlock = ($, body) =>
  seq($._newline, $._indent, body, $._dedent)

module.exports = {
  buildSimpleBlock,
  buildCompoundBlock,
  buildStruct,
  buildTuple,
  buildList,
  buildMember,
  buildString,
  // buildTypeArguments,
  buildGenericType,
  commaSep1,
  buildAbstractionBranch,
  buildParametricType,
}