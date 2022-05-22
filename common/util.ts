export const sep1 = (sep: string) => (rule: RuleOrLiteral) =>
  seq(rule, repeat(seq(sep, rule)))

const sep2 = (sep: string) => (rule: RuleOrLiteral) =>
  seq(rule, repeat1(seq(sep, rule)))

export const commaSep1 = sep1(',')

const commaSep2 = sep2(',')

export const newlineSep1 = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => sep1(($._newline as unknown) as string)

const buildDataStructure = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  element: Rule,
  rest: boolean,
  commaSepImpl = commaSep1,
) =>
  rest
    ? optional(
        choice(
          seq('...', field('rest', $.binding_pattern)),
          seq(
            commaSepImpl(element),
            optional(seq(',', '...', field('rest', $.binding_pattern))),
          ),
        ),
      )
    : optional(commaSepImpl(element))

export const buildStruct = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  fieldName: string,
  member: Rule,
  rest: boolean,
) => seq('{', buildDataStructure($, field(fieldName, member), rest), '}')

export const buildTuple = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  fieldName: string,
  element: Rule,
  rest: boolean,
  allowSingle: boolean,
) =>
  choice(
    seq(
      '(',
      buildDataStructure(
        $,
        field(fieldName, element),
        rest,
        allowSingle ? commaSep1 : commaSep2,
      ),
      ')',
    ),
    '()',
  )

export const buildList = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  fieldName: string,
  element: Rule,
  rest: boolean,
) => seq('[', buildDataStructure($, field(fieldName, element), rest), ']')

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

export const buildGenericType = (name: string, rule: Rule) =>
  seq('<', commaSep1(field(name, rule)), '>')

export const buildBindingPattern = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  allowDefaults: boolean,
) =>
  seq(
    field(
      'name',
      choice(
        alias($.identifier, $.identifier_pattern),
        alias($.type, $.type_pattern),
      ),
    ),
    optional(seq(':', field('type', $.type))),
    allowDefaults ? optional(seq('=', field('default', $._term))) : seq(),
  )

export const buildBlock = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  rule: Rule
) => seq('{', newlineSep1($)(rule), '}')

export const line = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
  rule: Rule,
) => seq(rule, choice($._newline, ';'))
