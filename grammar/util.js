const notFalse = (...args) => args.filter((element) => element !== false)

const commaSep2 = (rule) => seq(rule, repeat1(seq(',', rule)))

const commaSep1 = (rule) => seq(rule, repeat(seq(',', rule)))

const abstractionBranch = ($, blockType) =>
  seq(
    optional(field('typeParameters', typeParameters($))),
    field('parameters', $.parameters),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const dataStructure = ($, element, rest, commaSepImpl = commaSep1) =>
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

const struct = ($, member, rest = false) =>
  seq('{', dataStructure($, field('member', member), rest), '}')

const tuple = ($, element, rest = false, allowSingle = false) =>
  choice(
    '()',
    seq(
      '(',
      dataStructure(
        $,
        field('element', element),
        rest,
        allowSingle ? commaSep1 : commaSep2,
      ),
      ')',
    ),
  )

const list = ($, element, rest = false) =>
  seq('[', dataStructure($, field('element', element), rest), ']')

const member = ($, key, value) =>
  seq(
    choice(
      seq('[', field('key', key), ']'),
      field('key', alias($.identifier, $.shorthand_member_identifier)),
    ),
    ':',
    field('value', value),
  )

const string = ($, ...content) =>
  seq(
    $._string_start,
    repeat(choice(...content, $._string_content)),
    $._string_end,
  )

const internalTypeParameters = (parameter) =>
  seq('<', commaSep1(field('parameter', parameter)), '>')

const typeArguments = ($) => internalTypeParameters($._type)
const typeParameters = ($) => internalTypeParameters($.type_variable_declaration)

const simple = ($, line) => seq(line, $._newline)

const compound = ($, body) => seq($._newline, $._indent, body, $._dedent)

module.exports = {
  simple,
  compound,
  struct,
  tuple,
  list,
  member,
  string,
  typeArguments,
  typeParameters,
  commaSep1,
  abstractionBranch,
}
