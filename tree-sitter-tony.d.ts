import Parser from 'tree-sitter'

declare module 'tree-sitter-tony' {
  export enum NodeType {
    Abstraction = 'abstraction',
    AbstractionBranch = 'abstraction_branch',
    Access = 'access',
    Application = 'application',
    Argument = 'argument',
    Arguments = 'arguments',
    Assignment = 'assignment',
    Block = 'block',
    Boolean = 'boolean',
    Case = 'case',
    Comment = 'comment',
    CurriedType = 'curried_type',
    ElseIf = 'else_if',
    EscapeSequence = 'escape_sequence',
    Export = 'export',
    ExpressionPair = 'expression_pair',
    Generator = 'generator',
    HashBangLine = 'hash_bang_line',
    Identifier = 'identifier',
    IdentifierPattern = 'identifier_pattern',
    IdentifierPatternName = 'identifier_pattern_name',
    If = 'if',
    Import = 'import',
    ImportIdentifierPair = 'import_identifier_pair',
    ImportTypePair = 'import_type_pair',
    InfixApplication = 'infix_application',
    Interpolation = 'interpolation',
    List = 'list',
    ListComprehension = 'list_comprehension',
    ListPattern = 'list_pattern',
    ListType = 'list_type',
    Map = 'map',
    MapPattern = 'map_pattern',
    MapType = 'map_type',
    Module = 'module',
    Number = 'number',
    Parameters = 'parameters',
    ParametricType = 'parametric_type',
    PatternPair = 'pattern_pair',
    Pipeline = 'pipeline',
    PrefixApplication = 'prefix_application',
    Program = 'program',
    Regex = 'regex',
    RegexFlags = 'regex_flags',
    RegexPattern = 'regex_pattern',
    RestList = 'rest_list',
    RestMap = 'rest_map',
    RestTuple = 'rest_tuple',
    Return = 'return',
    ShorthandAccessIdentifier = 'shorthand_access_identifier',
    ShorthandPairIdentifier = 'shorthand_pair_identifier',
    ShorthandPairIdentifierPattern = 'shorthand_pair_identifier_pattern',
    SpreadList = 'spread_list',
    SpreadMap = 'spread_map',
    SpreadTuple = 'spread_tuple',
    String = 'string',
    StringPattern = 'string_pattern',
    Tuple = 'tuple',
    TuplePattern = 'tuple_pattern',
    TupleType = 'tuple_type',
    Type = 'type',
    TypeAlias = 'type_alias',
    TypeDeclaration = 'type_declaration',
    TypeVariable = 'type_variable',
    UnionType = 'union_type',
    When = 'when',
  }

  export type Expression =
    | Abstraction
    | Access
    | Application
    | Assignment
    | Case
    | Export
    | Identifier
    | If
    | Import
    | InfixApplication
    | List
    | ListComprehension
    | Literal
    | Map
    | Module
    | Pipeline
    | PrefixApplication
    | Return
    | Tuple
    | TypeAlias
  export type Declaration = Assignment | Module
  export type Literal = Boolean | Number | ParametricType | Regex | String

  export type Pattern =
    | IdentifierPattern
    | DestructuringPattern
    | LiteralPattern
  export type LiteralPattern =
    | Boolean
    | Number
    | ParametricType
    | Regex
    | StringPattern
  export type DestructuringPattern = ListPattern | MapPattern | TuplePattern

  export type TypeConstructor =
    | CurriedType
    | ListType
    | MapType
    | ParametricType
    | TupleType
    | TypeVariable
    | UnionType

  export interface Abstraction extends Parser.SyntaxNode {
    branchNodes: AbstractionBranch[]
  }
  export interface AbstractionBranch extends Parser.SyntaxNode {
    parametersNode: Parameters
    bodyNode: Block
  }
  export interface Access extends Parser.SyntaxNode {
    valueNode: Expression
    accessorNode: ShorthandAccessIdentifier | Expression
  }
  export interface Application extends Parser.SyntaxNode {
    valueNode: Expression
    argumentsNode: Arguments
  }
  export interface Argument extends Parser.SyntaxNode {
    valueNode?: Expression | SpreadTuple
  }
  export interface Arguments extends Parser.SyntaxNode {
    argumentNodes: Argument[]
  }
  export interface Assignment extends Parser.SyntaxNode {
    patternNode: IdentifierPattern | DestructuringPattern
    valueNode: Expression
  }
  export interface Block extends Parser.SyntaxNode {
    expressionNodes: Expression[]
  }
  export interface Boolean extends Parser.SyntaxNode {}
  export interface Case extends Parser.SyntaxNode {
    valueNode: Expression
    branchNodes: When[]
    elseNode?: Block
  }
  export interface Comment extends Parser.SyntaxNode {}
  export interface CurriedType extends Parser.SyntaxNode {
    parameterNodes: TypeConstructor[]
  }
  export interface ElseIf extends Parser.SyntaxNode {
    conditionNode: Expression
    bodyNode: Block
  }
  export interface EscapeSequence extends Parser.SyntaxNode {}
  export interface Export extends Parser.SyntaxNode {
    declarationNode: Declaration
  }
  export interface ExpressionPair extends Parser.SyntaxNode {
    keyNode: Expression | ShorthandAccessIdentifier
    valueNode: Expression
  }
  export interface Generator extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    valueNode: Expression
    conditionNode?: Expression
  }
  export interface HashBangLine extends Parser.SyntaxNode {}
  export interface Identifier extends Parser.SyntaxNode {}
  export interface IdentifierPattern extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    typeNode?: TypeConstructor
    defaultNode?: Expression
  }
  export interface IdentifierPatternName extends Identifier {}
  export interface If extends Parser.SyntaxNode {
    conditionNode: Expression
    bodyNode: Block
    elseIfNodes: ElseIf[]
    elseNode?: Block
  }
  export interface Import extends Parser.SyntaxNode {
    importNodes: (
      | IdentifierPattern
      | ImportIdentifierPair
      | Type
      | ImportTypePair
    )[]
    sourceNode: StringPattern
  }
  export interface ImportIdentifierPair extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    asNode: IdentifierPattern
  }
  export interface ImportTypePair extends Parser.SyntaxNode {
    nameNode: Type
    asNode: Type
  }
  export interface InfixApplication extends Parser.SyntaxNode {
    leftNode: Expression
    valueNode: Identifier
    rightNode: Expression
  }
  export interface Interpolation extends Parser.SyntaxNode {
    valueNode: Expression
  }
  export interface List extends Parser.SyntaxNode {
    elementNodes: (Expression | SpreadList)[]
  }
  export interface ListComprehension extends Parser.SyntaxNode {
    bodyNode: Block
    generatorNodes: Generator[]
  }
  export interface ListPattern extends Parser.SyntaxNode {
    elementNodes: (Pattern | RestList)[]
  }
  export interface ListType extends Parser.SyntaxNode {
    parameterNode: TypeConstructor
  }
  export interface Map extends Parser.SyntaxNode {
    elementNodes: (ExpressionPair | ShorthandPairIdentifier | SpreadMap)[]
  }
  export interface MapPattern extends Parser.SyntaxNode {
    elementNodes: (PatternPair | ShorthandPairIdentifierPattern | RestMap)[]
  }
  export interface MapType extends Parser.SyntaxNode {
    keyNode: TypeConstructor
    valueNode: TypeConstructor
  }
  export interface Module extends Parser.SyntaxNode {
    nameNode: TypeDeclaration
    bodyNode: Block
  }
  export interface Number extends Parser.SyntaxNode {}
  export interface Parameters extends Parser.SyntaxNode {
    parameterNodes: (Pattern | RestTuple)[]
  }
  export interface ParametricType extends Parser.SyntaxNode {
    nameNode: Type
    parameterNodes: TypeConstructor[]
  }
  export interface PatternPair extends Parser.SyntaxNode {
    keyNode: Expression | ShorthandAccessIdentifier
    valueNode: Pattern
  }
  export interface Pipeline extends Parser.SyntaxNode {
    argumentNode: Expression
    valueNode: Expression
  }
  export interface PrefixApplication extends Parser.SyntaxNode {
    valueNode: Identifier
    argumentNode: Expression
  }
  export interface Program extends Parser.SyntaxNode {
    hashBangLineNode: HashBangLine
    expressionNodes: Expression[]
  }
  export interface Regex extends Parser.SyntaxNode {
    patternNode: RegexPattern
    flagsNode?: RegexFlags
  }
  export interface RegexFlags extends Parser.SyntaxNode {}
  export interface RegexPattern extends Parser.SyntaxNode {}
  export interface Rest extends Parser.SyntaxNode {
    nameNode: IdentifierPattern
  }
  export interface RestList extends Rest {}
  export interface RestMap extends Rest {}
  export interface RestTuple extends Rest {}
  export interface Return extends Parser.SyntaxNode {
    valueNode?: Expression
  }
  export interface ShorthandAccessIdentifier extends Identifier {}
  export interface ShorthandPairIdentifier extends Identifier {}
  export interface ShorthandPairIdentifierPattern extends IdentifierPattern {}
  export interface Spread extends Parser.SyntaxNode {
    valueNode: Expression
  }
  export interface SpreadList extends Spread {}
  export interface SpreadMap extends Spread {}
  export interface SpreadTuple extends Spread {}
  export interface String extends Parser.SyntaxNode {
    interpolationNodes: Interpolation[]
    escapeSequenceNodes: EscapeSequence[]
  }
  export interface StringPattern extends Parser.SyntaxNode {
    escapeSequenceNodes: EscapeSequence[]
  }
  export interface Tuple extends Parser.SyntaxNode {
    elementNodes: (Expression | SpreadTuple)[]
  }
  export interface TuplePattern extends Parser.SyntaxNode {
    elementNodes: (Pattern | RestTuple)[]
  }
  export interface TupleType extends Parser.SyntaxNode {
    parameterNodes: TypeConstructor[]
  }
  export interface Type extends Parser.SyntaxNode {}
  export interface TypeAlias extends Parser.SyntaxNode {
    nameNode: TypeDeclaration
    typeNode: TypeConstructor
  }
  export interface TypeDeclaration extends Parser.SyntaxNode {
    nameNode: Type
    parameterNodes: TypeVariable[]
  }
  export interface TypeVariable extends Identifier {}
  export interface UnionType extends Parser.SyntaxNode {
    parameterNodes: TypeConstructor[]
  }
  export interface When extends Parser.SyntaxNode {
    patternNodes: Pattern[]
    bodyNode: Block
  }
}
