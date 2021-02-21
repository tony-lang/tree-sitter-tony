const sep1 = (sep) => (rule) => seq(rule, repeat(seq(sep, rule)))

const sep2 = (sep) => (rule) => seq(rule, repeat1(seq(sep, rule)))

const commaSep1 = sep1(',')

const commaSep2 = sep2(',')

const buildAbstractionBranch = ($, blockType) =>
  seq(
    optional(buildGenericType('typeParameter', $.type_variable_declaration)),
    buildTuple($, $._pattern, true, true),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const buildDataStructure = ($, element, rest, commaSepImpl = commaSep1) =>
  rest
    ? optional(
        choice(
          seq('...', field('rest', $.identifier_pattern)),
          seq(
            commaSepImpl(element),
            optional(seq(',', '...', field('rest', $.identifier_pattern))),
          ),
        ),
      )
    : optional(commaSepImpl(element))

const buildStruct = ($, member, rest = false) =>
  seq('{', buildDataStructure($, field('member', member), rest), '}')

const buildTuple = (
  $,
  element,
  rest = false,
  allowSingle = false,
  allowEmpty = true,
) => {
  const options = [
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
  ]

  if (allowEmpty) options.push('()')

  return choice(...options)
}

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

const buildGenericType = (name, rule) =>
  seq('<', commaSep1(field(name, rule)), '>')

const buildTypeConstraint = ($) =>
  seq(
    '<:',
    choice(
      field('constraint', $._type),
      seq('(', sep2(';')(field('constraint', $._type)), ')'),
    ),
  )

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
  buildGenericType,
  buildTypeConstraint,
  commaSep1,
  sep1,
  sep2,
  buildAbstractionBranch,
}
