// import { Dialect, Prec } from './dialects'
// import {
//   buildGenericType,
//   buildStruct,
//   buildTuple,
//   buildTypeConstraint,
//   commaSep1,
// } from './util'

// export const _term_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) => choice($.identifier, $._literal)

// export const parametric_type_constructor = (dialect: Dialect) => <
//   RuleName extends string
// >(
//   $: GrammarSymbols<RuleName>,
// ) => {
//   const nodes = [
//     field('name', $.type),
//     optional(buildGenericType('argument', $._type)),
//   ]

//   if (dialect === Dialect.Tony)
//     nodes.push(optional(buildTuple($, $._term_type, false, true, false)))

//   return prec.right(seq(...nodes))
// }

// export const intersection_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec.right(
//     Prec.IntersectionType,
//     seq(field('left', $._type), '&', field('right', $._type)),
//   )

// export const union_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec.right(
//     Prec.UnionType,
//     seq(field('left', $._type), '|', field('right', $._type)),
//   )

// export const subtraction_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec.right(
//     Prec.SubtractionType,
//     seq(
//       field('left', choice($.parametric_type, $.union_type)),
//       '\\',
//       field('right', choice($.parametric_type, $.union_type)),
//     ),
//   )

// export const conditional_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec.right(
//     seq(
//       field('type', $._type),
//       buildTypeConstraint($),
//       '?',
//       field('consequence', $._type),
//       ':',
//       field('alternative', $._type),
//     ),
//   )

// export const tuple_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) => buildTuple($, $._type)

// export const list_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) => seq('[', field('element', $._type), ']')

// export const access_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec(
//     Prec.Access,
//     seq(
//       field('type', $._type),
//       choice(
//         seq('[', field('value', $._term_type), ']'),
//         seq(
//           '->',
//           field('value', alias($.identifier, $.shorthand_access_identifier)),
//         ),
//       ),
//     ),
//   )

// export const refinement_type_declaration = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   prec.left(
//     seq(
//       field('name', alias($.identifier, $.identifier_pattern)),
//       '::',
//       field('type', $._type),
//     ),
//   )

// export const refinement_type = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) =>
//   seq(
//     '[',
//     field('generator', $._type),
//     '|',
//     commaSep1(field('predicate', $._predicate)),
//     ']',
//   )

// export const _predicate = <RuleName extends string>(
//   $: GrammarSymbols<RuleName>,
// ) => choice($.application, $.infix_application)
