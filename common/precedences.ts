export enum Operator {
  Access = 'Access',
  And = 'And',
  Biconditional = 'Biconditional',
  Difference = 'Difference',
  Equality = 'Equality',
  Exponentiation = 'Exponentiation',
  Implication = 'Implication',
  Mod = 'Mod',
  Named = 'Named',
  Not = 'Not',
  Other = 'Other',
  Or = 'Or',
  Order = 'Order',
  Pipeline = 'Pipeline',
  Product = 'Product',
  Sum = 'Sum',
}

export const precedences = <RuleName extends string>(
  $: GrammarSymbols<RuleName>,
) => [
  [
    Operator.Access,
    Operator.Pipeline,
    Operator.Not,
    Operator.Exponentiation,
    Operator.Product,
    Operator.Sum,
    Operator.Mod,
    Operator.Order,
    Operator.Equality,
    Operator.And,
    Operator.Or,
    Operator.Difference,
    Operator.Implication,
    Operator.Biconditional,
    Operator.Other,
    Operator.Named,
  ],

  // [$.assignment, $._term,
  //   Operator.Pipeline,
  //   Operator.Access,
  //   $.application,
  //   Operator.Not,
  //   Operator.Exponentiation,
  //   Operator.Product,
  //   Operator.Sum,
  //   Operator.Mod,
  //   Operator.Order,
  //   Operator.Equality,
  //   Operator.And,
  //   Operator.Or,
  //   Operator.Difference,
  //   Operator.Implication,
  //   Operator.Biconditional,
  //   Operator.Other,
  //   Operator.Named,
  //   $.static_application, $.group],

  // _term () :: application
  [$.application, $.tuple],

  // ? identifer :: hole
  [$.hole, $._term],
  // [$.hole, $.destructuring_pattern],
  // [$.hole, $.root_binding_pattern],

  // _term [ _term ] :: access
  // [$.access, $._element],

  // _term -> identifier :: access
  // [$.access, $._term],

  // { [ _term ] ... :: member
  [$.member, $._element],

  // _term ( ... binding_pattern ) = :: member
  // [$.tuple_pattern, $.application],
]
