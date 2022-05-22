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
import { Operator, Prec } from './precedences'

export const _statement = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._term, $.assignment, $.export, $.class, $.instance, $.data)

export const _term = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    'base',
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
    ),
  )

export const block = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', buildBlock($, field('term', choice($._term, $.assignment))))

export const _immediate_block = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    choice(seq('then', field('body', $._term)), field('body', $.block)),
  )

export const export_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', seq('export', field('declaration', $.assignment)))

export const assignment = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    'base',
    seq(field('pattern', $._assignable_pattern), '=', field('value', $._term)),
  )

export const class_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    'base',
    seq(
      'class',
      field('name', $.type),
      optional(seq(':', field('constraint', $._term))),
      buildBlock($, field('member', $.class_member)),
    ),
  )

export const class_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      field('name', alias($.identifier, $.identifier_pattern)),
      ':',
      field('type', $._term),
    ),
  )

export const instance = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      'instance',
      field('type', $._term),
      'of',
      field('class', $.type),
      buildBlock($, field('assignment', $.assignment)),
    ),
  )

export const _parameters = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildTuple($, 'parameter', $._pattern, true, true))

export const function_ = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right('base', seq($._parameters, '=>', field('body', $._term)))

export const _arguments = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', buildTuple($, 'argument', $.argument, true, true))

export const application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    'application',
    // Prec.Application,
    seq(
      field('name', $._term),
      choice($._arguments, field('argument', $._term)),
    ),
  )

export const argument = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  // prec(
  // Prec.Argument,
  choice(field('placeholder', '?'), field('value', $._element))
//)

export const infix_application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    // Prec.InfixApplication,
    choice(
      prec.left(
        Operator.Pipeline,
        seq(
          field('left', $._term),
          field('name', alias('&.', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Pipeline,
        seq(
          field('left', $._term),
          field('name', alias('.', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Not,
        seq(
          field('left', $._term),
          field('name', alias('!', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Exponentiation,
        seq(
          field('left', $._term),
          field('name', alias('^', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Product,
        seq(
          field('left', $._term),
          field('name', alias('*', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Product,
        seq(
          field('left', $._term),
          field('name', alias('/', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Sum,
        seq(
          field('left', $._term),
          field('name', alias('+', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Sum,
        seq(
          field('left', $._term),
          field('name', alias('-', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Mod,
        seq(
          field('left', $._term),
          field('name', alias('%', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Order,
        seq(
          field('left', $._term),
          field('name', alias('<', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Order,
        seq(
          field('left', $._term),
          field('name', alias('<=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Order,
        seq(
          field('left', $._term),
          field('name', alias('>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Order,
        seq(
          field('left', $._term),
          field('name', alias('>=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Equality,
        seq(
          field('left', $._term),
          field('name', alias('==', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Equality,
        seq(
          field('left', $._term),
          field('name', alias('!=', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.And,
        seq(
          field('left', $._term),
          field('name', alias('&&', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.And,
        seq(
          field('left', $._term),
          field('name', alias('&', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Or,
        seq(
          field('left', $._term),
          field('name', alias('||', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Or,
        seq(
          field('left', $._term),
          field('name', alias('|', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Difference,
        seq(
          field('left', $._term),
          field('name', alias('\\', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Implication,
        seq(
          field('left', $._term),
          field('name', alias('==>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Biconditional,
        seq(
          field('left', $._term),
          field('name', alias('<=>', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Extends,
        seq(
          field('left', $._term),
          field('name', alias('<:', $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Other,
        seq(
          field('left', $._term),
          field('name', alias($._operator, $.identifier)),
          field('right', $._term),
        ),
      ),
      prec.left(
        Operator.Named,
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
) => prec('base', choice($.left_section, $.right_section))

export const left_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', seq('(', field('value', $._term), $._section_identifier, ')'))

export const right_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', seq('(', $._section_identifier, field('value', $._term), ')'))

export const _section_identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  // prec(
  // Prec.SectionIdentifier,
  choice(
    seq('(', field('name', alias($._operator, $.identifier)), ')'),
    seq(
      '`',
      field('name', alias($._identifier_without_operators, $.identifier)),
      '`',
    ),
  )
// )

export const list_comprehension = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      '[',
      field('body', $._term),
      '|',
      commaSep1(
        choice(field('generator', $.generator), field('condition', $._term)),
      ),
      ']',
    ),
  )

export const generator = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      field('name', alias($.identifier, $.identifier_pattern)),
      'in',
      field('value', $._term),
    ),
  )

export const access = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    'access',
    // Prec.Access,
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
  prec.right('base', seq('return', field('value', $._term)))

export const conditional = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    'application',
    // Prec.Application,
    seq(
      field('condition', $._term),
      '?',
      field('body', $._term),
      optional(seq(':', field('else', $._term))),
    ),
  )

export const case_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    'base',
    seq(
      'case',
      field('value', $._term),
      repeat1(field('when', $.when)),
      'else',
      field('else', $._term),
    ),
  )

export const when = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    'base',
    seq('when', commaSep1(field('pattern', $._pattern)), $._immediate_block),
  )

export const struct = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    'patternOrTerm',
    // Prec.Term,
    buildStruct(
      $,
      'member',
      choice($.member, alias($.identifier, $.shorthand_member), $.spread),
      false,
    ),
  )

export const member = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', buildMember($, $._term, $._term))

export const tuple = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', buildTuple($, 'element', $._element, false, false))

export const list = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', buildList($, 'element', $._element, false))

export const _element = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec('base', choice($._term, $.spread))

export const spread = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', seq('...', field('value', $._term)))

export const pure = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec('base', prec.right(seq('pure', field('value', $._term))))

export const hole = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    'base',
    seq('?', field('name', alias($.identifier, $.identifier_pattern))),
  )

export const static_function = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    'base',
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
    'patternOrTerm',
    // Prec.Term,
    seq(
      field('value', $._term),
      '<',
      commaSep1(prec.left(field('argument', $._term))),
      '>',
    ),
  )

export const type_hint = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right('base', seq(field('value', $._term), 'as', field('type', $._term)))

export const data = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    Operator.Or,
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
    Operator.Or,
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
    'access',
    // Prec.Access,
    seq(field('from', $._term), '->', field('to', $._term)),
  )

export const optional_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right('base', seq('?', field('type', $._term)))

export const keyof_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.right('base', seq('keyof', field('type', $._term)))

export const map_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    'base',
    seq(
      '{',
      optional(seq(field('property', alias($.type, $.type_pattern)), 'in')),
      field('key', $._term),
      '->',
      field('value', $._term),
      '}',
    ),
  )

export const type = () => TYPE

export const _identifier_without_operators = () => IDENTIFIER
export const _operator = () => OPERATOR
export const identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left('base', choice($._operator, $._identifier_without_operators))

export const group = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('(', field('term', $._term), ')')
