export interface Parser {
  parse(input: string | Input, previousTree?: Tree, options?: {bufferSize?: number, includedRanges?: Range[]}): Tree;
  getLanguage(): any;
  setLanguage(language: any): void;
  getLogger(): Logger;
  setLogger(logFunc: Logger): void;
}

export type Point = {
  row: number;
  column: number;
};

export type Range = {
  startIndex: number,
  endIndex: number,
  startPosition: Point,
  endPosition: Point
};

export type Edit = {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  startPosition: Point;
  oldEndPosition: Point;
  newEndPosition: Point;
};

export type Logger = (
  message: string,
  params: {[param: string]: string},
  type: "parse" | "lex"
) => void;

export interface Input {
  seek(index: number): void;
  read(): any;
}

interface SyntaxNodeBase {
  tree: Tree;
  type: string;
  isNamed: boolean;
  text: string;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  parent: SyntaxNode | null;
  children: Array<SyntaxNode>;
  namedChildren: Array<SyntaxNode>;
  childCount: number;
  namedChildCount: number;
  firstChild: SyntaxNode | null;
  firstNamedChild: SyntaxNode | null;
  lastChild: SyntaxNode | null;
  lastNamedChild: SyntaxNode | null;
  nextSibling: SyntaxNode | null;
  nextNamedSibling: SyntaxNode | null;
  previousSibling: SyntaxNode | null;
  previousNamedSibling: SyntaxNode | null;

  hasChanges(): boolean;
  hasError(): boolean;
  isMissing(): boolean;
  toString(): string;
  child(index: number): SyntaxNode | null;
  namedChild(index: number): SyntaxNode | null;
  firstChildForIndex(index: number): SyntaxNode | null;
  firstNamedChildForIndex(index: number): SyntaxNode | null;

  descendantForIndex(index: number): SyntaxNode;
  descendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  namedDescendantForIndex(index: number): SyntaxNode;
  namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  descendantForPosition(position: Point): SyntaxNode;
  descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  namedDescendantForPosition(position: Point): SyntaxNode;
  namedDescendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  descendantsOfType<T extends TypeString>(types: T | readonly T[], startPosition?: Point, endPosition?: Point): NodeOfType<T>[];

  closest<T extends SyntaxType>(types: T | readonly T[]): NamedNode<T> | null;
  walk(): TreeCursor;
}

export interface TreeCursor {
  nodeType: string;
  nodeText: string;
  nodeIsNamed: boolean;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  readonly currentNode: SyntaxNode

  reset(node: SyntaxNode): void
  gotoParent(): boolean;
  gotoFirstChild(): boolean;
  gotoFirstChildForIndex(index: number): boolean;
  gotoNextSibling(): boolean;
}

export interface Tree {
  readonly rootNode: SyntaxNode;

  edit(delta: Edit): Tree;
  walk(): TreeCursor;
  getChangedRanges(other: Tree): Range[];
  getEditedRange(other: Tree): Range;
}

interface NamedNodeBase extends SyntaxNodeBase {
    isNamed: true;
}

/** An unnamed node with the given type string. */
export interface UnnamedNode<T extends string = string> extends SyntaxNodeBase {
  type: T;
  isNamed: false;
}

type PickNamedType<Node, T extends string> = Node extends { type: T; isNamed: true } ? Node : never;

type PickType<Node, T extends string> = Node extends { type: T } ? Node : never;

/** A named node with the given `type` string. */
export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<SyntaxNode, T>;

/**
 * A node with the given `type` string.
 *
 * Note that this matches both named and unnamed nodes. Use `NamedNode<T>` to pick only named nodes.
 */
export type NodeOfType<T extends string> = PickType<SyntaxNode, T>;

interface TreeCursorOfType<S extends string, T extends SyntaxNodeBase> {
  nodeType: S;
  currentNode: T;
}

type TreeCursorRecord = { [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>> };

/**
 * A tree cursor whose `nodeType` correlates with `currentNode`.
 *
 * The typing becomes invalid once the underlying cursor is mutated.
 *
 * The intention is to cast a `TreeCursor` to `TypedTreeCursor` before
 * switching on `nodeType`.
 *
 * For example:
 * ```ts
 * let cursor = root.walk();
 * while (cursor.gotoNextSibling()) {
 *   const c = cursor as TypedTreeCursor;
 *   switch (c.nodeType) {
 *     case SyntaxType.Foo: {
 *       let node = c.currentNode; // Typed as FooNode.
 *       break;
 *     }
 *   }
 * }
 * ```
 */
export type TypedTreeCursor = TreeCursorRecord[keyof TreeCursorRecord];

export interface ErrorNode extends NamedNodeBase {
    type: SyntaxType.ERROR;
    hasError(): true;
}

export const enum SyntaxType {
  ERROR = "ERROR",
  Abstraction = "abstraction",
  AbstractionBranch = "abstraction_branch",
  Access = "access",
  Application = "application",
  Argument = "argument",
  Assignment = "assignment",
  Block = "block",
  Boolean = "boolean",
  Case = "case",
  CurriedType = "curried_type",
  DestructuringPattern = "destructuring_pattern",
  ElseIf = "else_if",
  Enum = "enum",
  EnumValue = "enum_value",
  Export = "export",
  ExportedImport = "exported_import",
  Generator = "generator",
  Group = "group",
  Identifier = "identifier",
  IdentifierPattern = "identifier_pattern",
  IdentifierPatternName = "identifier_pattern_name",
  If = "if",
  Implement = "implement",
  Import = "import",
  ImportIdentifier = "import_identifier",
  ImportType = "import_type",
  InfixApplication = "infix_application",
  Interface = "interface",
  Interpolation = "interpolation",
  IntersectionType = "intersection_type",
  List = "list",
  ListComprehension = "list_comprehension",
  ListPattern = "list_pattern",
  ListType = "list_type",
  MapType = "map_type",
  Member = "member",
  MemberPattern = "member_pattern",
  MemberType = "member_type",
  Number = "number",
  ParametricType = "parametric_type",
  PatternGroup = "pattern_group",
  Pipeline = "pipeline",
  PrefixApplication = "prefix_application",
  Program = "program",
  RawString = "raw_string",
  RefinementType = "refinement_type",
  RefinementTypeDeclaration = "refinement_type_declaration",
  Regex = "regex",
  Rest = "rest",
  Return = "return",
  ShorthandAccessIdentifier = "shorthand_access_identifier",
  ShorthandMember = "shorthand_member",
  ShorthandMemberIdentifier = "shorthand_member_identifier",
  ShorthandMemberPattern = "shorthand_member_pattern",
  Spread = "spread",
  String = "string",
  Struct = "struct",
  StructPattern = "struct_pattern",
  StructType = "struct_type",
  TaggedPattern = "tagged_pattern",
  TaggedType = "tagged_type",
  TaggedValue = "tagged_value",
  Tuple = "tuple",
  TuplePattern = "tuple_pattern",
  TupleType = "tuple_type",
  TypeAlias = "type_alias",
  TypeDeclaration = "type_declaration",
  TypeGroup = "type_group",
  TypeHint = "type_hint",
  TypeVariable = "type_variable",
  TypeVariableDeclaration = "type_variable_declaration",
  TypeVariableDeclarationName = "type_variable_declaration_name",
  Typeof = "typeof",
  UnionType = "union_type",
  When = "when",
  Comment = "comment",
  EscapeSequence = "escape_sequence",
  HashBangLine = "hash_bang_line",
  RegexFlags = "regex_flags",
  RegexPattern = "regex_pattern",
  Type = "type",
}

export type UnnamedType =
  | "&"
  | "("
  | "()"
  | ")"
  | ","
  | "->"
  | "."
  | "..."
  | "/"
  | ":"
  | "::"
  | ":="
  | ";"
  | "<"
  | "<:"
  | "="
  | "=>"
  | ">"
  | "?"
  | "@"
  | "["
  | "]"
  | "`"
  | "as"
  | SyntaxType.Case // both named and unnamed
  | "else"
  | "else if"
  | SyntaxType.Enum // both named and unnamed
  | SyntaxType.Export // both named and unnamed
  | "false"
  | "from"
  | SyntaxType.If // both named and unnamed
  | SyntaxType.Implement // both named and unnamed
  | SyntaxType.Import // both named and unnamed
  | "in"
  | SyntaxType.Interface // both named and unnamed
  | "r/"
  | SyntaxType.Return // both named and unnamed
  | "then"
  | "true"
  | SyntaxType.Type // both named and unnamed
  | SyntaxType.Typeof // both named and unnamed
  | SyntaxType.When // both named and unnamed
  | "{"
  | "|"
  | "|="
  | "}"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode = 
  | AbstractionNode
  | AbstractionBranchNode
  | AccessNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BlockNode
  | BooleanNode
  | CaseNode
  | CurriedTypeNode
  | DestructuringPatternNode
  | ElseIfNode
  | EnumNode
  | EnumValueNode
  | ExportNode
  | ExportedImportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IdentifierPatternNode
  | IdentifierPatternNameNode
  | IfNode
  | ImplementNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode
  | InfixApplicationNode
  | InterfaceNode
  | InterpolationNode
  | IntersectionTypeNode
  | ListNode
  | ListComprehensionNode
  | ListPatternNode
  | ListTypeNode
  | MapTypeNode
  | MemberNode
  | MemberPatternNode
  | MemberTypeNode
  | NumberNode
  | ParametricTypeNode
  | PatternGroupNode
  | PipelineNode
  | PrefixApplicationNode
  | ProgramNode
  | RawStringNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | RegexNode
  | RestNode
  | ReturnNode
  | ShorthandAccessIdentifierNode
  | ShorthandMemberNode
  | ShorthandMemberIdentifierNode
  | ShorthandMemberPatternNode
  | SpreadNode
  | StringNode
  | StructNode
  | StructPatternNode
  | StructTypeNode
  | TaggedPatternNode
  | TaggedTypeNode
  | TaggedValueNode
  | TupleNode
  | TuplePatternNode
  | TupleTypeNode
  | TypeAliasNode
  | TypeDeclarationNode
  | TypeGroupNode
  | TypeHintNode
  | TypeVariableNode
  | TypeVariableDeclarationNode
  | TypeVariableDeclarationNameNode
  | TypeofNode
  | UnionTypeNode
  | WhenNode
  | UnnamedNode<"&">
  | UnnamedNode<"(">
  | UnnamedNode<"()">
  | UnnamedNode<")">
  | UnnamedNode<",">
  | UnnamedNode<"->">
  | UnnamedNode<".">
  | UnnamedNode<"...">
  | UnnamedNode<"/">
  | UnnamedNode<":">
  | UnnamedNode<"::">
  | UnnamedNode<":=">
  | UnnamedNode<";">
  | UnnamedNode<"<">
  | UnnamedNode<"<:">
  | UnnamedNode<"=">
  | UnnamedNode<"=>">
  | UnnamedNode<">">
  | UnnamedNode<"?">
  | UnnamedNode<"@">
  | UnnamedNode<"[">
  | UnnamedNode<"]">
  | UnnamedNode<"`">
  | UnnamedNode<"as">
  | UnnamedNode<SyntaxType.Case>
  | CommentNode
  | UnnamedNode<"else">
  | UnnamedNode<"else if">
  | UnnamedNode<SyntaxType.Enum>
  | EscapeSequenceNode
  | UnnamedNode<SyntaxType.Export>
  | UnnamedNode<"false">
  | UnnamedNode<"from">
  | HashBangLineNode
  | UnnamedNode<SyntaxType.If>
  | UnnamedNode<SyntaxType.Implement>
  | UnnamedNode<SyntaxType.Import>
  | UnnamedNode<"in">
  | UnnamedNode<SyntaxType.Interface>
  | UnnamedNode<"r/">
  | RegexFlagsNode
  | RegexPatternNode
  | UnnamedNode<SyntaxType.Return>
  | UnnamedNode<"then">
  | UnnamedNode<"true">
  | UnnamedNode<SyntaxType.Type>
  | TypeNode
  | UnnamedNode<SyntaxType.Typeof>
  | UnnamedNode<SyntaxType.When>
  | UnnamedNode<"{">
  | UnnamedNode<"|">
  | UnnamedNode<"|=">
  | UnnamedNode<"}">
  | ErrorNode
  ;

export interface AbstractionNode extends NamedNodeBase {
  type: SyntaxType.Abstraction;
  branchNodes: AbstractionBranchNode[];
}

export interface AbstractionBranchNode extends NamedNodeBase {
  type: SyntaxType.AbstractionBranch;
  bodyNode: BlockNode;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode)[];
  restNode?: RestNode;
  typeParameterNodes: TypeVariableDeclarationNode[];
}

export interface AccessNode extends NamedNodeBase {
  type: SyntaxType.Access;
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | ShorthandAccessIdentifierNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ApplicationNode extends NamedNodeBase {
  type: SyntaxType.Application;
  elementNodes: ArgumentNode[];
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  typeArgumentNodes: ParametricTypeNode[];
}

export interface ArgumentNode extends NamedNodeBase {
  type: SyntaxType.Argument;
  placeholderNode?: UnnamedNode<"?">;
  valueNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | SpreadNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface AssignmentNode extends NamedNodeBase {
  type: SyntaxType.Assignment;
  patternNode: DestructuringPatternNode | IdentifierPatternNode | PatternGroupNode | TaggedPatternNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | CaseNode | EnumNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImplementNode | ImportNode | InfixApplicationNode | InterfaceNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface BlockNode extends NamedNodeBase {
  type: SyntaxType.Block;
  termNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | CaseNode | EnumNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImplementNode | ImportNode | InfixApplicationNode | InterfaceNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface BooleanNode extends NamedNodeBase {
  type: SyntaxType.Boolean;
}

export interface CaseNode extends NamedNodeBase {
  type: SyntaxType.Case;
  elseNode: BlockNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  whenNodes: WhenNode[];
}

export interface CurriedTypeNode extends NamedNodeBase {
  type: SyntaxType.CurriedType;
  fromNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  toNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface DestructuringPatternNode extends NamedNodeBase {
  type: SyntaxType.DestructuringPattern;
  aliasNode?: IdentifierPatternNameNode;
  patternNode: ListPatternNode | StructPatternNode | TuplePatternNode;
}

export interface ElseIfNode extends NamedNodeBase {
  type: SyntaxType.ElseIf;
  bodyNode: BlockNode;
  conditionNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface EnumNode extends NamedNodeBase {
  type: SyntaxType.Enum;
  nameNode: TypeNode;
  valueNodes: EnumValueNode[];
}

export interface EnumValueNode extends NamedNodeBase {
  type: SyntaxType.EnumValue;
  nameNode: IdentifierPatternNameNode;
  valueNode?: BooleanNode | NumberNode | RegexNode | StringNode;
}

export interface ExportNode extends NamedNodeBase {
  type: SyntaxType.Export;
  declarationNode: AssignmentNode;
}

export interface ExportedImportNode extends NamedNodeBase {
  type: SyntaxType.ExportedImport;
  defaultNode?: IdentifierPatternNameNode;
  importNodes: (ImportIdentifierNode | ImportTypeNode)[];
  sourceNode: RawStringNode;
}

export interface GeneratorNode extends NamedNodeBase {
  type: SyntaxType.Generator;
  conditionNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierPatternNameNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface GroupNode extends NamedNodeBase {
  type: SyntaxType.Group;
  termNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface IdentifierPatternNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPattern;
  defaultNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierPatternNameNode;
  typeNode?: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface IdentifierPatternNameNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPatternName;
}

export interface IfNode extends NamedNodeBase {
  type: SyntaxType.If;
  bodyNode: BlockNode;
  conditionNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  elseNode?: BlockNode;
  elseIfNodes: ElseIfNode[];
}

export interface ImplementNode extends NamedNodeBase {
  type: SyntaxType.Implement;
  assignmentNodes: AssignmentNode[];
  nameNode: ParametricTypeNode;
}

export interface ImportNode extends NamedNodeBase {
  type: SyntaxType.Import;
  defaultNode?: IdentifierPatternNameNode;
  importNodes: (ImportIdentifierNode | ImportTypeNode)[];
  sourceNode: RawStringNode;
}

export interface ImportIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ImportIdentifier;
  asNode: IdentifierPatternNode;
  nameNode?: IdentifierPatternNameNode;
}

export interface ImportTypeNode extends NamedNodeBase {
  type: SyntaxType.ImportType;
  asNode?: TypeNode;
  nameNode: TypeNode;
}

export interface InfixApplicationNode extends NamedNodeBase {
  type: SyntaxType.InfixApplication;
  leftNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierNode;
  rightNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface InterfaceNode extends NamedNodeBase {
  type: SyntaxType.Interface;
  memberNodes: IdentifierPatternNode[];
  nameNode: TypeDeclarationNode;
}

export interface InterpolationNode extends NamedNodeBase {
  type: SyntaxType.Interpolation;
  termNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface IntersectionTypeNode extends NamedNodeBase {
  type: SyntaxType.IntersectionType;
  leftNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  rightNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface ListNode extends NamedNodeBase {
  type: SyntaxType.List;
  elementNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | SpreadNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface ListComprehensionNode extends NamedNodeBase {
  type: SyntaxType.ListComprehension;
  bodyNode: BlockNode;
  generatorNodes: GeneratorNode[];
}

export interface ListPatternNode extends NamedNodeBase {
  type: SyntaxType.ListPattern;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode)[];
  restNode?: RestNode;
}

export interface ListTypeNode extends NamedNodeBase {
  type: SyntaxType.ListType;
  elementNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface MapTypeNode extends NamedNodeBase {
  type: SyntaxType.MapType;
  keyNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  valueNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface MemberNode extends NamedNodeBase {
  type: SyntaxType.Member;
  keyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | ShorthandMemberIdentifierNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface MemberPatternNode extends NamedNodeBase {
  type: SyntaxType.MemberPattern;
  keyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | ShorthandMemberIdentifierNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode;
}

export interface MemberTypeNode extends NamedNodeBase {
  type: SyntaxType.MemberType;
  keyNode: ShorthandMemberIdentifierNode;
  valueNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface NumberNode extends NamedNodeBase {
  type: SyntaxType.Number;
}

export interface ParametricTypeNode extends NamedNodeBase {
  type: SyntaxType.ParametricType;
  argumentNodes: (CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode)[];
  elementNodes: (BooleanNode | NumberNode | RegexNode | StringNode)[];
  nameNode: TypeNode;
}

export interface PatternGroupNode extends NamedNodeBase {
  type: SyntaxType.PatternGroup;
  patternNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode;
}

export interface PipelineNode extends NamedNodeBase {
  type: SyntaxType.Pipeline;
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface PrefixApplicationNode extends NamedNodeBase {
  type: SyntaxType.PrefixApplication;
  nameNode: IdentifierNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
  hashBangLineNode?: HashBangLineNode;
  termNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | CaseNode | EnumNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImplementNode | ImportNode | InfixApplicationNode | InterfaceNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface RawStringNode extends NamedNodeBase {
  type: SyntaxType.RawString;
}

export interface RefinementTypeNode extends NamedNodeBase {
  type: SyntaxType.RefinementType;
  generatorNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  predicateNodes: (ApplicationNode | InfixApplicationNode | PipelineNode | PrefixApplicationNode)[];
}

export interface RefinementTypeDeclarationNode extends NamedNodeBase {
  type: SyntaxType.RefinementTypeDeclaration;
  constraintNodes: (CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode)[];
  nameNode: IdentifierPatternNameNode;
}

export interface RegexNode extends NamedNodeBase {
  type: SyntaxType.Regex;
  flagsNode?: RegexFlagsNode;
  patternNode: RegexPatternNode;
}

export interface RestNode extends NamedNodeBase {
  type: SyntaxType.Rest;
  nameNode: IdentifierPatternNode;
}

export interface ReturnNode extends NamedNodeBase {
  type: SyntaxType.Return;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ShorthandAccessIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ShorthandAccessIdentifier;
}

export interface ShorthandMemberNode extends NamedNodeBase {
  type: SyntaxType.ShorthandMember;
}

export interface ShorthandMemberIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ShorthandMemberIdentifier;
}

export interface ShorthandMemberPatternNode extends NamedNodeBase {
  type: SyntaxType.ShorthandMemberPattern;
  defaultNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierPatternNameNode;
  typeNode?: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface SpreadNode extends NamedNodeBase {
  type: SyntaxType.Spread;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface StringNode extends NamedNodeBase {
  type: SyntaxType.String;
  escapeSequenceNodes: EscapeSequenceNode[];
  interpolationNodes: InterpolationNode[];
}

export interface StructNode extends NamedNodeBase {
  type: SyntaxType.Struct;
  memberNodes: (MemberNode | ShorthandMemberNode | SpreadNode)[];
}

export interface StructPatternNode extends NamedNodeBase {
  type: SyntaxType.StructPattern;
  memberNodes: (MemberPatternNode | ShorthandMemberPatternNode)[];
  restNode?: RestNode;
}

export interface StructTypeNode extends NamedNodeBase {
  type: SyntaxType.StructType;
  memberNodes: MemberTypeNode[];
}

export interface TaggedPatternNode extends NamedNodeBase {
  type: SyntaxType.TaggedPattern;
  nameNode: IdentifierNode;
  patternNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode;
}

export interface TaggedTypeNode extends NamedNodeBase {
  type: SyntaxType.TaggedType;
  nameNode: IdentifierPatternNameNode;
  typeNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface TaggedValueNode extends NamedNodeBase {
  type: SyntaxType.TaggedValue;
  nameNode: IdentifierNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface TupleNode extends NamedNodeBase {
  type: SyntaxType.Tuple;
  elementNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | SpreadNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface TuplePatternNode extends NamedNodeBase {
  type: SyntaxType.TuplePattern;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode)[];
  restNode?: RestNode;
}

export interface TupleTypeNode extends NamedNodeBase {
  type: SyntaxType.TupleType;
  elementNodes: (CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode)[];
}

export interface TypeAliasNode extends NamedNodeBase {
  type: SyntaxType.TypeAlias;
  nameNode: TypeDeclarationNode;
  typeNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface TypeDeclarationNode extends NamedNodeBase {
  type: SyntaxType.TypeDeclaration;
  elementNodes: IdentifierPatternNode[];
  nameNode: TypeNode;
  parameterNodes: TypeVariableDeclarationNode[];
}

export interface TypeGroupNode extends NamedNodeBase {
  type: SyntaxType.TypeGroup;
  typeNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface TypeHintNode extends NamedNodeBase {
  type: SyntaxType.TypeHint;
  typeNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BooleanNode | ExportNode | ExportedImportNode | GroupNode | IdentifierNode | IfNode | ImportNode | InfixApplicationNode | ListNode | ListComprehensionNode | NumberNode | PipelineNode | PrefixApplicationNode | RegexNode | ReturnNode | StringNode | StructNode | TaggedValueNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface TypeVariableNode extends NamedNodeBase {
  type: SyntaxType.TypeVariable;
}

export interface TypeVariableDeclarationNode extends NamedNodeBase {
  type: SyntaxType.TypeVariableDeclaration;
  constraintNodes: (CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode)[];
  nameNode: TypeVariableDeclarationNameNode;
}

export interface TypeVariableDeclarationNameNode extends NamedNodeBase {
  type: SyntaxType.TypeVariableDeclarationName;
}

export interface TypeofNode extends NamedNodeBase {
  type: SyntaxType.Typeof;
  valueNode: BooleanNode | IdentifierNode | NumberNode | RegexNode | StringNode;
}

export interface UnionTypeNode extends NamedNodeBase {
  type: SyntaxType.UnionType;
  leftNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
  rightNode: CurriedTypeNode | IntersectionTypeNode | ListTypeNode | MapTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeVariableNode | TypeofNode | UnionTypeNode;
}

export interface WhenNode extends NamedNodeBase {
  type: SyntaxType.When;
  bodyNode: BlockNode;
  patternNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode)[];
}

export interface CommentNode extends NamedNodeBase {
  type: SyntaxType.Comment;
}

export interface EscapeSequenceNode extends NamedNodeBase {
  type: SyntaxType.EscapeSequence;
}

export interface HashBangLineNode extends NamedNodeBase {
  type: SyntaxType.HashBangLine;
}

export interface RegexFlagsNode extends NamedNodeBase {
  type: SyntaxType.RegexFlags;
}

export interface RegexPatternNode extends NamedNodeBase {
  type: SyntaxType.RegexPattern;
}

export interface TypeNode extends NamedNodeBase {
  type: SyntaxType.Type;
}

