import { IDENTIFIER, OPERATOR, TYPE } from './constants'
import {
  buildBlock,
  buildList,
  buildMember,
  buildStruct,
  buildTuple,
  commaSep1,
  sep1,
} from './util'
import { Prec } from './precedences'

export const _statement = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._term, $.assignment, $.export, $.class, $.instance, $.data)

export const _term = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  choice(
    $.block,
    $.function,
    $.application,
    $.infix_application,
    $._section,
    $.access,
    $.return,
    $.conditional,
    $.case,
    $.struct,
    $.tuple,
    $.list,
    $.list_comprehension,
    $.pure,
    $.hole,
    $.static_function,
    $.static_application,
    $.type_hint,
    $.function_type,
    $.optional_type,
    $.keyof_type,
    $.map_type,
    $.type,
    $.identifier,
    $._literal,
    $.group,
  )

export const block = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildBlock($, field('term', choice($._term, $.assignment)))

export const _immediate_block = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice(seq('then', field('body', $._term)), field('body', $.block))

export const export_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('export', field('declaration', $.assignment))

export const assignment = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(field('pattern', $._assignable_pattern), '=', field('value', $._term)),
  )

export const class_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    seq(
      'class',
      field('name', $.type),
      optional(seq(':', field('constraint', $._term))),
      buildBlock($, field('member', $.class_member)),
    )
  )

export const class_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern)),
    ':',
    field('type', $._term),
  )

export const instance = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'instance',
    field('type', $._term),
    'of',
    field('class', $.type),
    buildBlock($, field('assignment', $.assignment)),
  )

export const _parameters = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildTuple($, 'parameter', $._pattern, true, true)

export const function_ = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq($._parameters, '=>', field('body', $._term)),
  )

export const _arguments = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => buildTuple($, 'argument', $.argument, true, true)

export const application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Application,
    seq(
      field('name', $._term),
      choice($._arguments, field('argument', $._term)),
    ),
  )

export const argument = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec(Prec.Argument, choice(field('placeholder', '?'), field('value', $._element)))

export const infix_application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.InfixApplication,
    choice(
      prec.left(
        Prec.Pipeline,
        seq(
          field('left', $._term),
          field('name', alias('&.', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Pipeline,
        seq(
          field('left', $._term),
          field('name', alias('.', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Not,
        seq(
          field('left', $._term),
          field('name', alias('!', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Exponentiation,
        seq(
          field('left', $._term),
          field('name', alias('^', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._term),
          field('name', alias('*', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Product,
        seq(
          field('left', $._term),
          field('name', alias('/', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._term),
          field('name', alias('+', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Sum,
        seq(
          field('left', $._term),
          field('name', alias('-', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Mod,
        seq(
          field('left', $._term),
          field('name', alias('%', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._term),
          field('name', alias('<', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._term),
          field('name', alias('<=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._term),
          field('name', alias('>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Order,
        seq(
          field('left', $._term),
          field('name', alias('>=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._term),
          field('name', alias('==', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Equality,
        seq(
          field('left', $._term),
          field('name', alias('!=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.And,
        seq(
          field('left', $._term),
          field('name', alias('&&', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.And,
        seq(
          field('left', $._term),
          field('name', alias('&', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Or,
        seq(
          field('left', $._term),
          field('name', alias('||', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Or,
        seq(
          field('left', $._term),
          field('name', alias('|', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Difference,
        seq(
          field('left', $._term),
          field('name', alias('\\', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Implication,
        seq(
          field('left', $._term),
          field('name', alias('==>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Biconditional,
        seq(
          field('left', $._term),
          field('name', alias('<=>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.Extends,
        seq(
          field('left', $._term),
          field('name', alias('<:', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.OperatorInfixApplication,
        seq(
          field('left', $._term),
          field('name', alias($._operator, $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Prec.NamedInfixApplication,
        seq(
          field('left', $._term),
          '`',
          field('name', alias($._identifier_without_operators, $.identifier)),
          '`',
          field('right', $._term),
        ),
      ),
    ),
  )

export const _section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($.left_section, $.right_section)

export const left_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('(', field('value', $._term), $._section_identifier, ')')

export const right_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('(', $._section_identifier, field('value', $._term), ')')

export const _section_identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.SectionIdentifier,
    choice(
      seq('(', field('name', alias($._operator, $.identifier)), ')'),
      seq(
        '`',
        field('name', alias($._identifier_without_operators, $.identifier)),
        '`',
      ),
    ),
  )

export const list_comprehension = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '[',
    field('body', $._term),
    '|',
    commaSep1(
      choice(field('generator', $.generator), field('condition', $._term)),
    ),
    ']',
  )

export const generator = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern)),
    'in',
    field('value', $._term),
  )

export const access = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    Prec.Access,
    seq(
      field('left', $._term),
      choice(
        seq('[', field('right', $._term), ']'),
        seq(
          '->',
          field('right', alias($.identifier, $.shorthand_access_identifier)),
        ),
      ),
    ),
  )

export const return_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('return', field('value', $._term)))

export const conditional = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Application,
    seq(
      field('condition', $._term),
      '?',
      field('body', $._term),
      optional(seq(':', field('else', $._term))),
    ),
  )

export const case_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    seq(
      'case',
      field('value', $._term),
      repeat1(field('when', $.when)),
      'else',
      field('else', $._term),
    ),
  )

export const when = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('when', commaSep1(field('pattern', $._pattern)), $._immediate_block)

export const struct = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    Prec.Term,
    buildStruct(
      $,
      choice($.member, alias($.identifier, $.shorthand_member), $.spread),
    ),
  )

export const member = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildMember($, $._term, $._term)

export const tuple = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildTuple($, 'element', $._element)

export const list = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildList($, $._element)

export const _element = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._term, $.spread)

export const spread = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('...', field('value', $._term))

export const pure = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('pure', field('value', $._term)))

export const hole = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('?', field('name', alias($.identifier, $.identifier_pattern)))

export const static_function = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(
      '<',
      commaSep1(field('parameter', $._pattern)),
      '>',
      field('value', $._term),
    ),
  )

export const static_application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Term,
    seq(
      field('value', $._term),
      '<',
      commaSep1(prec.left(field('argument', $._term))),
      '>',
    ),
  )

export const type_hint = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right(seq(field('value', $._term), 'as', field('type', $._term)))

export const data = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    Prec.Or,
    seq(
      'data',
      field('name', $.type),
      '=',
      optional(seq('(', commaSep1(field('parameter', $._pattern)), ')', '=>')),
      sep1('|')(field('constructor', $.tag)),
    ),
  )

export const tag = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    Prec.Or,
    seq(
      field(
        'name',
        alias($._identifier_without_operators, $.identifier_pattern),
      ),
      optional(field('type', $._term)),
    ),
  )

export const function_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Access,
    seq(field('from', $._term), '->', field('to', $._term)),
  )

export const optional_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right(seq('?', field('type', $._term)))

export const keyof_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right(seq('keyof', field('type', $._term)))

export const map_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '{',
    optional(seq(field('property', alias($.type, $.type_pattern)), 'in')),
    field('key', $._term),
    '->',
    field('value', $._term),
    '}',
  )

export const type = () => TYPE

export const _identifier_without_operators = () => IDENTIFIER
export const _operator = () => OPERATOR
export const identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(choice($._operator, $._identifier_without_operators))

export const group = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(Prec.Group, seq('(', field('term', $._term), ')'))
