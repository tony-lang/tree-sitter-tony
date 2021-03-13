import { IDENTIFIER, OPERATOR } from './constants'
import {
  buildAbstraction,
  buildCompoundBlock,
  buildGenericType,
  buildList,
  buildMember,
  buildSimpleBlock,
  buildStruct,
  buildTuple,
  commaSep1,
} from './util'
import { Prec } from './enums'

export const _term = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  choice(seq($._simple_term, $._newline), $._compound_term)

export const _simple_term = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Term,
    choice(
      alias($.simple_abstraction, $.abstraction),
      $.application,
      $.prefix_application,
      $.infix_application,
      $._section,
      $.access,
      alias($.simple_assignment, $.assignment),
      alias($.simple_export, $.export),
      $.return,
      alias($.simple_if, $.if),
      $.struct,
      $.tuple,
      $.list,
      $.list_comprehension,
      $.tagged_value,
      $.type_alias,
      $.type_hint,
      $.identifier,
      $._literal,
      $.group,
    ),
  )

export const _compound_term = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.Term,
    choice(
      alias($.compound_abstraction, $.abstraction),
      alias($.compound_assignment, $.assignment),
      alias($.compound_export, $.export),
      alias($.compound_if, $.if),
      $.case,
      $.enum,
      $.class,
      $.instance,
    ),
  )

export const _simple_block = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(field('term', $._simple_term))

export const _compound_block = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    choice(
      buildSimpleBlock($, field('term', $._simple_term)),
      buildCompoundBlock($, repeat1(field('term', $._term))),
    ),
  )

export const simple_export = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq('export', field('declaration', alias($.simple_assignment, $.assignment)))

export const compound_export = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'export',
    field('declaration', alias($.compound_assignment, $.assignment)),
  )

export const simple_assignment = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Assignment,
    seq(
      field('pattern', $._assignable_pattern),
      ':=',
      field('value', $._simple_term),
    ),
  )

export const compound_assignment = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.Assignment,
    seq(
      field('pattern', $._assignable_pattern),
      ':=',
      choice(
        field('value', $._compound_term),
        seq($._indent, field('value', $._compound_term), $._dedent),
      ),
    ),
  )

export const enum_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'enum',
    field('name', $.type),
    buildCompoundBlock($, repeat1(field('value', $.enum_value))),
  )

export const enum_value = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    optional(seq('=', field('value', $._literal))),
  )

export const class_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'class',
    field('name', $.type_declaration),
    buildCompoundBlock($, repeat1(field('member', $.class_member))),
  )

export const class_member = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    '::',
    field('type', $._type),
  )

export const instance = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    'instance',
    field('name', $.parametric_type),
    buildCompoundBlock(
      $,
      repeat1(
        choice(
          buildSimpleBlock(
            $,
            field('assignment', alias($.simple_assignment, $.assignment)),
          ),
          field('assignment', alias($.compound_assignment, $.assignment)),
        ),
      ),
    ),
  )

export const argument = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(choice(field('placeholder', '?'), field('value', $._element)))

export const simple_abstraction = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(20, buildAbstraction($, $._simple_block))

export const compound_abstraction = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => prec.left(20, buildAbstraction($, $._compound_block))

export const application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec(
    Prec.Application,
    seq(
      field('name', $._simple_term),
      optional(buildGenericType('typeArgument', $.parametric_type)),
      buildTuple($, $.argument, false, true),
    ),
  )

export const prefix_application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    Prec.PrefixApplication,
    seq(
      field('name', alias($._operator, $.identifier)),
      field('value', $._simple_term),
    ),
  )

export const infix_application = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  choice(
    prec.left(
      Prec.Pipeline,
      seq(
        field('left', $._simple_term),
        field('name', alias('&.', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Pipeline,
      seq(
        field('left', $._simple_term),
        field('name', alias('.', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Not,
      seq(
        field('left', $._simple_term),
        field('name', alias('!', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Exponentiation,
      seq(
        field('left', $._simple_term),
        field('name', alias('^', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Product,
      seq(
        field('left', $._simple_term),
        field('name', alias('*', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Product,
      seq(
        field('left', $._simple_term),
        field('name', alias('/', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Sum,
      seq(
        field('left', $._simple_term),
        field('name', alias('+', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Sum,
      seq(
        field('left', $._simple_term),
        field('name', alias('-', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Mod,
      seq(
        field('left', $._simple_term),
        field('name', alias('%', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Order,
      seq(
        field('left', $._simple_term),
        field('name', alias('<', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Order,
      seq(
        field('left', $._simple_term),
        field('name', alias('<=', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Order,
      seq(
        field('left', $._simple_term),
        field('name', alias('>', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Order,
      seq(
        field('left', $._simple_term),
        field('name', alias('>=', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Equality,
      seq(
        field('left', $._simple_term),
        field('name', alias('==', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Equality,
      seq(
        field('left', $._simple_term),
        field('name', alias('!=', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.And,
      seq(
        field('left', $._simple_term),
        field('name', alias('&&', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Or,
      seq(
        field('left', $._simple_term),
        field('name', alias('||', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Implication,
      seq(
        field('left', $._simple_term),
        field('name', alias('==>', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.Biconditional,
      seq(
        field('left', $._simple_term),
        field('name', alias('<=>', $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.OperatorInfixApplication,
      seq(
        field('left', $._simple_term),
        field('name', alias($._operator, $.identifier)),
        field('right', $._simple_term),
      ),
    ),
    prec.left(
      Prec.NamedInfixApplication,
      seq(
        field('left', $._simple_term),
        '`',
        field('name', alias($._identifier_without_operators, $.identifier)),
        '`',
        field('right', $._simple_term),
      ),
    ),
  )

export const _section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($.left_section, $.right_section)

export const left_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('(', field('value', $._simple_term), $._section_identifier, ')')

export const right_section = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => seq('(', $._section_identifier, field('value', $._simple_term), ')')

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
    field('body', alias($._simple_block, $.block)),
    '|',
    commaSep1(field('generator', $.generator)),
    ']',
  )

export const generator = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    field('name', alias($.identifier, $.identifier_pattern_name)),
    'in',
    field('value', $._simple_term),
    optional(seq('if', field('condition', $._simple_term))),
  )

export const access = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.left(
    Prec.Access,
    seq(
      field('name', $._simple_term),
      choice(
        seq('[', field('value', $._simple_term), ']'),
        seq(
          '->',
          field('value', alias($.identifier, $.shorthand_access_identifier)),
        ),
      ),
    ),
  )

export const return_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec.right(seq('return', field('value', $._simple_term)))

export const simple_if = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(
      'if',
      field('condition', $._simple_term),
      'then',
      field('body', alias($._simple_block, $.block)),
      optional(seq('else', field('else', alias($._simple_block, $.block)))),
    ),
  )

export const compound_if = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(
      'if',
      field('condition', $._simple_term),
      'then',
      field('body', alias($._compound_block, $.block)),
      repeat(field('elseIf', $.else_if)),
      optional(seq('else', field('else', alias($._compound_block, $.block)))),
    ),
  )

export const else_if = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'else if',
    field('condition', $._simple_term),
    'then',
    field('body', alias($._compound_block, $.block)),
  )

export const case_ = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'case',
    field('value', $._simple_term),
    repeat1(field('when', $.when)),
    'else',
    field('else', alias($._compound_block, $.block)),
  )

export const when = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq(
    'when',
    commaSep1(field('pattern', $._pattern)),
    'then',
    field('body', alias($._compound_block, $.block)),
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
  buildMember($, $._simple_term, $._simple_term)

export const tuple = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(Prec.Term, buildTuple($, $._element))

export const list = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  prec(Prec.Term, buildList($, $._element))

export const _element = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._simple_term, $.spread)

export const spread = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('...', field('value', $._simple_term))

export const tagged_value = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  seq(
    ':',
    field('name', alias($._identifier_without_operators, $.identifier)),
    field('value', $._simple_term),
  )

export const type_alias = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.right(
    seq(
      'type',
      field('name', $.type_declaration),
      ':=',
      field('type', $._type),
    ),
  )

export const type_hint = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) =>
  prec.left(
    Prec.TypeHint,
    seq(field('value', $._simple_term), 'as', field('type', $._type)),
  )

export const _identifier_without_operators = () => IDENTIFIER

export const _operator = () => OPERATOR

export const identifier = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => choice($._operator, $._identifier_without_operators)

export const group = <RuleName extends string>($: GrammarSymbols<RuleName>) =>
  seq('(', field('term', $._simple_term), ')')
