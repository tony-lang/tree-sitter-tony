const sep1 = (sep: string) => (rule: RuleOrLiteral) =>
  seq(rule, repeat(seq(sep, rule)))

const sep2 = (sep: string) => (rule: RuleOrLiteral) =>
  seq(rule, repeat1(seq(sep, rule)))

export const commaSep1 = sep1(',')

const commaSep2 = sep2(',')

export const buildAbstractionBranch = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  blockType: Rule,
) =>
  seq(
    optional(buildGenericType('typeParameter', $.type_variable_declaration)),
    buildTuple($, $._pattern, true, true),
    '=>',
    field('body', alias(blockType, $.block)),
  )

const buildDataStructure = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  element: Rule,
  rest: boolean,
  commaSepImpl = commaSep1,
) =>
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

export const buildStruct = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  member: Rule,
  rest = false,
) => seq('{', buildDataStructure($, field('member', member), rest), '}')

export const buildTuple = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  element: Rule,
  rest = false,
  allowSingle = false,
  allowEmpty = true,
) => {
  const options: RuleOrLiteral[] = [
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

export const buildList = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  element: Rule,
  rest = false,
) => seq('[', buildDataStructure($, field('element', element), rest), ']')

export const buildMember = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  key: Rule,
  value: Rule,
) =>
  seq(
    choice(
      seq('[', field('key', key), ']'),
      field('key', alias($.identifier, $.shorthand_member_identifier)),
    ),
    ':',
    field('value', value),
  )

export const buildString = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  ...content: Rule[]
) =>
  seq(
    $._string_start,
    repeat(choice(...content, $._string_content)),
    $._string_end,
  )

export const buildGenericType = (
  name: string,
  rule: Rule,
  singleParameter = false,
) =>
  seq(
    '(',
    singleParameter ? field(name, rule) : commaSep1(field(name, rule)),
    ')',
  )

export const buildTypeConstraint = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '<:',
    choice(
      field('constraint', $._type),
      seq('(', sep2(';')(field('constraint', $._type)), ')'),
    ),
  )

export const buildTypeDeclaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  singleParameter = false,
) =>
  seq(
    field('name', $.type),
    singleParameter
      ? buildGenericType('parameter', $.type_variable_declaration, true)
      : optional(
          buildGenericType('parameter', $.type_variable_declaration, false),
        ),
    optional(buildTuple($, $.identifier_pattern, false, true)),
  )

export const buildSimpleBlock = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  line: Rule,
) => seq(line, $._newline)

export const buildCompoundBlock = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  body: Rule,
) => seq($._newline, $._indent, body, $._dedent)
