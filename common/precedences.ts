export enum Prec {
  SubtractionType = 'SubtractionType',
  Type = 'Type',
  UnionType = 'UnionType',
  CurriedOrIntersectionType = 'CurriedOrIntersectionType',
  LabeledType = 'LabeledType',
  OptionalType = 'OptionalType',
  TaggedType = 'TaggedType',

  NamedInfixApplication = 'NamedInfixApplication',
  OperatorInfixApplication = 'OperatorInfixApplication',
  Biconditional = 'Biconditional',
  Implication = 'Implication',
  Or = 'Or',
  And = 'And',
  Equality = 'Equality',
  Order = 'Order',
  Mod = 'Mod',
  Sum = 'Sum',
  Product = 'Product',
  Exponentiation = 'Exponentiation',
  Not = 'Not',
  Pipeline = 'Pipeline',

  Identifier = 'Identifier',
  SectionIdentifier = 'SectionIdentifier',
  TypeHint = 'TypeHint',
  TaggedValue = 'TaggedValue',
  Assignment = 'Assignment',
  InfixApplication = 'InfixApplication',
  PrefixApplication = 'PrefixApplication',
  Application = 'Application',
  PatternOrTerm = 'PatternOrTerm',
  Access = 'Access',
}

const typePrecedences = [
  Prec.Access,
  Prec.TaggedType,
  Prec.OptionalType,
  Prec.LabeledType,
  Prec.CurriedOrIntersectionType,
  Prec.UnionType,
  Prec.Type,
  Prec.SubtractionType,
]

const termPrecedences = [
  Prec.PatternOrTerm,
  Prec.Application,
  Prec.PrefixApplication,
  Prec.InfixApplication,
  Prec.Assignment,
  Prec.TypeHint,
  Prec.TaggedValue,
  Prec.SectionIdentifier,
  Prec.Identifier,
]

const operatorPrecedences = [
  Prec.Pipeline,
  Prec.Access,
  Prec.Not,
  Prec.Exponentiation,
  Prec.Product,
  Prec.Sum,
  Prec.Mod,
  Prec.Order,
  Prec.Equality,
  Prec.And,
  Prec.Or,
  Prec.Implication,
  Prec.Biconditional,
  Prec.OperatorInfixApplication,
  Prec.NamedInfixApplication,
]

export const precedences = () => [
  typePrecedences,
  termPrecedences,
  operatorPrecedences,
]
