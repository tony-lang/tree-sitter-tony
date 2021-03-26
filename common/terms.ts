import { IDENTIFIER, OPERATOR, TYPE } from './constants'
import {
  buildBlock,
  buildGenericType,
  buildList,
  buildMember,
  buildStruct,
  buildTuple,
  buildTypeConstraint,
  buildTypeDeclaration,
  commaSep1,
  sep1,
} from './util'
import { Prec } from './enums'

export const _term = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    Prec.Term,
    choice(
      $.block,
      $.function,
      $.application,
      $.infix_application,
      $._section,
      $.access,
      $.assignment,
      $.export,
      $.return,
      $.ternary,
      $.if,
      $.case,
      $.class,
      $.instance,
      $.struct,
      $.tuple,
      $.list,
      $.list_comprehension,
      $.parametric_type_instance,
      $.pure,
      $.hole,
      $.type_hint,
      $.data,
      $.function_type,
      $.optional_type,
      $.map_type,
      $.keyof_type,
      $.type,
      $.identifier,
      $._literal,
      $.group,
    ),
  )

export const block = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  buildBlock($, field('term', $._term))

export const export_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('export', field('declaration', $.assignment))

export const assignment = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Assignment,
    seq(field('pattern', $._assignable_pattern), '=', field('value', $._term)),
  )

export const class_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'class',
    field('name', $.type),
    optional(buildTypeConstraint($)),
    buildBlock($, field('member', $.class_member)),
  )

export const class_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    ':',
    field('type', $._term),
  )

export const instance = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'instance',
    buildTypeDeclaration($),
    'of',
    field('class', $.type),
    buildBlock($, field('assignment', $.assignment)),
  )

export const argument = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Argument,
    choice(field('placeholder', '?'), field('value', $._element)),
  )

export const function_ = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    seq(
      optional(buildGenericType('typeParameter', $.type_variable_declaration)),
      buildTuple($, $._pattern, true, true),
      '=>',
      field('body', $._term),
    ),
  )

export const application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Application,
    seq(
      field('name', $._term),
      choice(
        prec(Prec.Argument, buildTuple($, $.argument, false, true)),
        field('element', $._term),
      ),
    ),
  )

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
      choice(
        field('generator', $.list_comprehension_generator),
        field('condition', $.list_comprehension_condition),
      ),
    ),
    ']',
  )

export const list_comprehension_generator = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    'in',
    field('value', $._term),
  )

export const list_comprehension_condition = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => field('value', $._term)

export const access = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    Prec.Access,
    seq(
      field('name', $._term),
      choice(
        seq('[', field('value', $._term), ']'),
        seq(
          '->',
          field('value', alias($.identifier, $.shorthand_access_identifier)),
        ),
      ),
    ),
  )

export const return_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('return', field('value', $._term)))

export const ternary = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    20,
    seq(
      field('condition', $._term),
      '?',
      field('body', $._term),
      optional(seq(':', field('else', $._term))),
    ),
  )

export const if_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    seq(
      'if',
      field('condition', $._term),
      choice(seq('then', field('body', $._term)), field('body', $.block)),
      repeat(field('elseIf', $.else_if)),
      optional(seq('else', field('else', $._term))),
    ),
  )

export const else_if = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    seq(
      'else if',
      field('condition', $._term),
      choice(seq('then', field('body', $._term)), field('body', $.block)),
    ),
  )

export const case_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(
    seq(
      'case',
      field('value', $._term),
      $._newline,
      repeat1(field('when', $.when)),
      'else',
      field('else', $._term),
    ),
  )

export const when = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'when',
    commaSep1(field('pattern', $._pattern)),
    choice(seq('then', field('body', $._term)), field('body', $.block)),
  )

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
  prec(Prec.Term, buildTuple($, $._element))

export const list = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(Prec.Term, buildList($, $._element))

export const _element = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._term, $.spread)

export const spread = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('...', field('value', $._term))

export const parametric_type_instance = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.ParametricTypeInstance,
    seq(
      field('name', $._term),
      buildGenericType('typeArgument', $._term),
    ),
  )

export const pure = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('pure', field('value', $._term)))

export const hole = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(
    Prec.Hole,
    seq('?', field('name', alias($.identifier, $.identifier_pattern_name))),
  )

export const type_hint = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.TypeHint,
    seq(field('value', $._term), 'as', field('type', $._term)),
  )

export const data = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(seq('data', buildTypeDeclaration($), '=', sep1('|')(field('constructor', $.data_constructor))))

export const data_constructor = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(seq(
    field(
      'name',
      alias($._identifier_without_operators, $.identifier_pattern_name),
    ),
    optional(field('type', $._term)),
  ))

export const type_variable_declaration = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    seq(
      field('name', alias($.type, $.type_variable_declaration_name)),
      optional(buildTypeConstraint($)),
    ),
  )

export const function_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(field('from', $._term), '=>', field('to', $._term)),
  )

export const optional_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(20, seq(field('type', $._term), '?'))

export const map_type = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    '{',
    '[',
    optional(
      seq(
        field('property', alias($.type, $.type_variable_declaration_name)),
        'in',
      ),
    ),
    field('key', $._term),
    ']',
    ':',
    field('value', $._term),
    '}',
  )

export const keyof_type = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('Keyof', field('type', $._term)))

export const type = () => TYPE

export const _identifier_without_operators = () => IDENTIFIER
export const _operator = () => OPERATOR
export const identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._operator, $._identifier_without_operators)

export const group = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(Prec.Group, seq('(', field('term', $._term), ')'))
