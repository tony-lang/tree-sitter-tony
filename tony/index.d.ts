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
  Access = "access",
  AccessType = "access_type",
  Application = "application",
  Argument = "argument",
  Assignment = "assignment",
  Block = "block",
  Boolean = "boolean",
  Case = "case",
  Class = "class",
  ClassMember = "class_member",
  ConditionalType = "conditional_type",
  CurriedType = "curried_type",
  DestructuringPattern = "destructuring_pattern",
  ElseIf = "else_if",
  Export = "export",
  ExportedImport = "exported_import",
  Group = "group",
  Hole = "hole",
  Identifier = "identifier",
  IdentifierPattern = "identifier_pattern",
  IdentifierPatternName = "identifier_pattern_name",
  If = "if",
  Import = "import",
  ImportIdentifier = "import_identifier",
  ImportType = "import_type",
  InfixApplication = "infix_application",
  Instance = "instance",
  Interpolation = "interpolation",
  IntersectionType = "intersection_type",
  Keyof = "keyof",
  LabeledType = "labeled_type",
  LeftSection = "left_section",
  List = "list",
  ListComprehension = "list_comprehension",
  ListComprehensionCondition = "list_comprehension_condition",
  ListComprehensionGenerator = "list_comprehension_generator",
  ListPattern = "list_pattern",
  ListType = "list_type",
  MapType = "map_type",
  Member = "member",
  MemberPattern = "member_pattern",
  MemberType = "member_type",
  Number = "number",
  OptionalType = "optional_type",
  ParametricType = "parametric_type",
  ParametricTypeInstance = "parametric_type_instance",
  PatternGroup = "pattern_group",
  Program = "program",
  Pure = "pure",
  RawString = "raw_string",
  RefinementType = "refinement_type",
  RefinementTypeDeclaration = "refinement_type_declaration",
  Regex = "regex",
  Return = "return",
  RightSection = "right_section",
  ShorthandAccessIdentifier = "shorthand_access_identifier",
  ShorthandMember = "shorthand_member",
  ShorthandMemberIdentifier = "shorthand_member_identifier",
  ShorthandMemberPattern = "shorthand_member_pattern",
  Spread = "spread",
  String = "string",
  Struct = "struct",
  StructPattern = "struct_pattern",
  StructType = "struct_type",
  SubtractionType = "subtraction_type",
  TaggedPattern = "tagged_pattern",
  TaggedType = "tagged_type",
  Ternary = "ternary",
  Tuple = "tuple",
  TuplePattern = "tuple_pattern",
  TupleType = "tuple_type",
  TypeAlias = "type_alias",
  TypeGroup = "type_group",
  TypeHint = "type_hint",
  TypeVariableDeclaration = "type_variable_declaration",
  Typeof = "typeof",
  UnionType = "union_type",
  When = "when",
  Comment = "comment",
  EscapeSequence = "escape_sequence",
  HashBangLine = "hash_bang_line",
  RegexFlags = "regex_flags",
  RegexPattern = "regex_pattern",
  Type = "type",
  TypeVariableDeclarationName = "type_variable_declaration_name",
  WildcardPattern = "wildcard_pattern",
}

export type UnnamedType =
  | "&"
  | "("
  | "()"
  | ")"
  | ","
  | "->"
  | "..."
  | "/"
  | ":"
  | "::"
  | ";"
  | "<"
  | "<:"
  | "="
  | "=>"
  | ">"
  | "?"
  | "@"
  | "["
  | "\\"
  | "]"
  | "`"
  | "as"
  | SyntaxType.Case // both named and unnamed
  | SyntaxType.Class // both named and unnamed
  | "else"
  | "else if"
  | SyntaxType.Export // both named and unnamed
  | "false"
  | "from"
  | SyntaxType.If // both named and unnamed
  | SyntaxType.Import // both named and unnamed
  | "in"
  | SyntaxType.Instance // both named and unnamed
  | SyntaxType.Keyof // both named and unnamed
  | "of"
  | SyntaxType.Pure // both named and unnamed
  | "r/"
  | SyntaxType.Return // both named and unnamed
  | "then"
  | "true"
  | SyntaxType.Type // both named and unnamed
  | SyntaxType.Typeof // both named and unnamed
  | SyntaxType.When // both named and unnamed
  | "{"
  | "|"
  | "}"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode = 
  | AbstractionNode
  | AccessNode
  | AccessTypeNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BlockNode
  | BooleanNode
  | CaseNode
  | ClassNode
  | ClassMemberNode
  | ConditionalTypeNode
  | CurriedTypeNode
  | DestructuringPatternNode
  | ElseIfNode
  | ExportNode
  | ExportedImportNode
  | GroupNode
  | HoleNode
  | IdentifierNode
  | IdentifierPatternNode
  | IdentifierPatternNameNode
  | IfNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode
  | InfixApplicationNode
  | InstanceNode
  | InterpolationNode
  | IntersectionTypeNode
  | KeyofNode
  | LabeledTypeNode
  | LeftSectionNode
  | ListNode
  | ListComprehensionNode
  | ListComprehensionConditionNode
  | ListComprehensionGeneratorNode
  | ListPatternNode
  | ListTypeNode
  | MapTypeNode
  | MemberNode
  | MemberPatternNode
  | MemberTypeNode
  | NumberNode
  | OptionalTypeNode
  | ParametricTypeNode
  | ParametricTypeInstanceNode
  | PatternGroupNode
  | ProgramNode
  | PureNode
  | RawStringNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | RegexNode
  | ReturnNode
  | RightSectionNode
  | ShorthandAccessIdentifierNode
  | ShorthandMemberNode
  | ShorthandMemberIdentifierNode
  | ShorthandMemberPatternNode
  | SpreadNode
  | StringNode
  | StructNode
  | StructPatternNode
  | StructTypeNode
  | SubtractionTypeNode
  | TaggedPatternNode
  | TaggedTypeNode
  | TernaryNode
  | TupleNode
  | TuplePatternNode
  | TupleTypeNode
  | TypeAliasNode
  | TypeGroupNode
  | TypeHintNode
  | TypeVariableDeclarationNode
  | TypeofNode
  | UnionTypeNode
  | WhenNode
  | UnnamedNode<"&">
  | UnnamedNode<"(">
  | UnnamedNode<"()">
  | UnnamedNode<")">
  | UnnamedNode<",">
  | UnnamedNode<"->">
  | UnnamedNode<"...">
  | UnnamedNode<"/">
  | UnnamedNode<":">
  | UnnamedNode<"::">
  | UnnamedNode<";">
  | UnnamedNode<"<">
  | UnnamedNode<"<:">
  | UnnamedNode<"=">
  | UnnamedNode<"=>">
  | UnnamedNode<">">
  | UnnamedNode<"?">
  | UnnamedNode<"@">
  | UnnamedNode<"[">
  | UnnamedNode<"\\">
  | UnnamedNode<"]">
  | UnnamedNode<"`">
  | UnnamedNode<"as">
  | UnnamedNode<SyntaxType.Case>
  | UnnamedNode<SyntaxType.Class>
  | CommentNode
  | UnnamedNode<"else">
  | UnnamedNode<"else if">
  | EscapeSequenceNode
  | UnnamedNode<SyntaxType.Export>
  | UnnamedNode<"false">
  | UnnamedNode<"from">
  | HashBangLineNode
  | UnnamedNode<SyntaxType.If>
  | UnnamedNode<SyntaxType.Import>
  | UnnamedNode<"in">
  | UnnamedNode<SyntaxType.Instance>
  | UnnamedNode<SyntaxType.Keyof>
  | UnnamedNode<"of">
  | UnnamedNode<SyntaxType.Pure>
  | UnnamedNode<"r/">
  | RegexFlagsNode
  | RegexPatternNode
  | UnnamedNode<SyntaxType.Return>
  | UnnamedNode<"then">
  | UnnamedNode<"true">
  | UnnamedNode<SyntaxType.Type>
  | TypeNode
  | TypeVariableDeclarationNameNode
  | UnnamedNode<SyntaxType.Typeof>
  | UnnamedNode<SyntaxType.When>
  | WildcardPatternNode
  | UnnamedNode<"{">
  | UnnamedNode<"|">
  | UnnamedNode<"}">
  | ErrorNode
  ;

export interface AbstractionNode extends NamedNodeBase {
  type: SyntaxType.Abstraction;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode)[];
  restNode?: IdentifierPatternNode;
  typeParameterNodes: TypeVariableDeclarationNode[];
}

export interface AccessNode extends NamedNodeBase {
  type: SyntaxType.Access;
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandAccessIdentifierNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface AccessTypeNode extends NamedNodeBase {
  type: SyntaxType.AccessType;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  valueNode: BooleanNode | IdentifierNode | NumberNode | RegexNode | ShorthandAccessIdentifierNode | StringNode;
}

export interface ApplicationNode extends NamedNodeBase {
  type: SyntaxType.Application;
  elementNodes: (AbstractionNode | AccessNode | ApplicationNode | ArgumentNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode)[];
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ArgumentNode extends NamedNodeBase {
  type: SyntaxType.Argument;
  placeholderNode?: UnnamedNode<"?">;
  valueNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface AssignmentNode extends NamedNodeBase {
  type: SyntaxType.Assignment;
  patternNode: DestructuringPatternNode | IdentifierPatternNode | PatternGroupNode | TaggedPatternNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface BlockNode extends NamedNodeBase {
  type: SyntaxType.Block;
  termNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface BooleanNode extends NamedNodeBase {
  type: SyntaxType.Boolean;
}

export interface CaseNode extends NamedNodeBase {
  type: SyntaxType.Case;
  elseNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  whenNodes: WhenNode[];
}

export interface ClassNode extends NamedNodeBase {
  type: SyntaxType.Class;
  constraintNodes: (AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode)[];
  memberNodes: ClassMemberNode[];
  nameNode: TypeNode;
}

export interface ClassMemberNode extends NamedNodeBase {
  type: SyntaxType.ClassMember;
  nameNode: IdentifierPatternNameNode;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface ConditionalTypeNode extends NamedNodeBase {
  type: SyntaxType.ConditionalType;
  alternativeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  consequenceNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  constraintNodes: (AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode)[];
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface CurriedTypeNode extends NamedNodeBase {
  type: SyntaxType.CurriedType;
  fromNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  toNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface DestructuringPatternNode extends NamedNodeBase {
  type: SyntaxType.DestructuringPattern;
  aliasNode?: IdentifierPatternNameNode;
  patternNode: ListPatternNode | StructPatternNode | TuplePatternNode;
}

export interface ElseIfNode extends NamedNodeBase {
  type: SyntaxType.ElseIf;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  conditionNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
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

export interface GroupNode extends NamedNodeBase {
  type: SyntaxType.Group;
  termNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface HoleNode extends NamedNodeBase {
  type: SyntaxType.Hole;
  nameNode: IdentifierPatternNameNode;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface IdentifierPatternNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPattern;
  defaultNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierPatternNameNode;
  typeNode?: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface IdentifierPatternNameNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPatternName;
}

export interface IfNode extends NamedNodeBase {
  type: SyntaxType.If;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  conditionNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  elseNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  elseIfNodes: ElseIfNode[];
}

export interface ImportNode extends NamedNodeBase {
  type: SyntaxType.Import;
  defaultNode?: IdentifierPatternNameNode;
  importNodes: (ImportIdentifierNode | ImportTypeNode)[];
  sourceNode: RawStringNode;
}

export interface ImportIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ImportIdentifier;
  asNode: IdentifierPatternNameNode;
  nameNode?: IdentifierPatternNameNode;
}

export interface ImportTypeNode extends NamedNodeBase {
  type: SyntaxType.ImportType;
  asNode: TypeNode;
  nameNode?: TypeNode;
}

export interface InfixApplicationNode extends NamedNodeBase {
  type: SyntaxType.InfixApplication;
  leftNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierNode;
  rightNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface InstanceNode extends NamedNodeBase {
  type: SyntaxType.Instance;
  assignmentNodes: AssignmentNode[];
  classNode: TypeNode;
  elementNodes: IdentifierPatternNode[];
  nameNode: TypeNode;
  parameterNodes: TypeVariableDeclarationNode[];
}

export interface InterpolationNode extends NamedNodeBase {
  type: SyntaxType.Interpolation;
  termNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface IntersectionTypeNode extends NamedNodeBase {
  type: SyntaxType.IntersectionType;
  leftNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  rightNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface KeyofNode extends NamedNodeBase {
  type: SyntaxType.Keyof;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface LabeledTypeNode extends NamedNodeBase {
  type: SyntaxType.LabeledType;
  labelNode: IdentifierNode;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface LeftSectionNode extends NamedNodeBase {
  type: SyntaxType.LeftSection;
  nameNode: IdentifierNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ListNode extends NamedNodeBase {
  type: SyntaxType.List;
  elementNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface ListComprehensionNode extends NamedNodeBase {
  type: SyntaxType.ListComprehension;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  conditionNodes: ListComprehensionConditionNode[];
  generatorNodes: ListComprehensionGeneratorNode[];
}

export interface ListComprehensionConditionNode extends NamedNodeBase {
  type: SyntaxType.ListComprehensionCondition;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ListComprehensionGeneratorNode extends NamedNodeBase {
  type: SyntaxType.ListComprehensionGenerator;
  nameNode: IdentifierPatternNameNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface ListPatternNode extends NamedNodeBase {
  type: SyntaxType.ListPattern;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode)[];
  restNode?: IdentifierPatternNode;
}

export interface ListTypeNode extends NamedNodeBase {
  type: SyntaxType.ListType;
  elementNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface MapTypeNode extends NamedNodeBase {
  type: SyntaxType.MapType;
  keyNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  propertyNode?: TypeVariableDeclarationNameNode;
  valueNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface MemberNode extends NamedNodeBase {
  type: SyntaxType.Member;
  keyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandMemberIdentifierNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface MemberPatternNode extends NamedNodeBase {
  type: SyntaxType.MemberPattern;
  keyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandMemberIdentifierNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  valueNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode;
}

export interface MemberTypeNode extends NamedNodeBase {
  type: SyntaxType.MemberType;
  keyNode: ShorthandMemberIdentifierNode;
  valueNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface NumberNode extends NamedNodeBase {
  type: SyntaxType.Number;
}

export interface OptionalTypeNode extends NamedNodeBase {
  type: SyntaxType.OptionalType;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface ParametricTypeNode extends NamedNodeBase {
  type: SyntaxType.ParametricType;
  argumentNodes: (AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode)[];
  elementNodes: (BooleanNode | IdentifierNode | NumberNode | RegexNode | StringNode)[];
  nameNode: TypeNode;
}

export interface ParametricTypeInstanceNode extends NamedNodeBase {
  type: SyntaxType.ParametricTypeInstance;
  nameNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  typeArgumentNodes: ParametricTypeNode[];
}

export interface PatternGroupNode extends NamedNodeBase {
  type: SyntaxType.PatternGroup;
  patternNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
  hashBangLineNode?: HashBangLineNode;
  importNodes: (ExportedImportNode | ImportNode)[];
  termNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface PureNode extends NamedNodeBase {
  type: SyntaxType.Pure;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface RawStringNode extends NamedNodeBase {
  type: SyntaxType.RawString;
}

export interface RefinementTypeNode extends NamedNodeBase {
  type: SyntaxType.RefinementType;
  generatorNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  predicateNodes: (ApplicationNode | InfixApplicationNode)[];
}

export interface RefinementTypeDeclarationNode extends NamedNodeBase {
  type: SyntaxType.RefinementTypeDeclaration;
  nameNode: IdentifierPatternNameNode;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface RegexNode extends NamedNodeBase {
  type: SyntaxType.Regex;
  flagsNode?: RegexFlagsNode;
  patternNode: RegexPatternNode;
}

export interface ReturnNode extends NamedNodeBase {
  type: SyntaxType.Return;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface RightSectionNode extends NamedNodeBase {
  type: SyntaxType.RightSection;
  nameNode: IdentifierNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
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
  defaultNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  nameNode: IdentifierPatternNameNode;
  typeNode?: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface SpreadNode extends NamedNodeBase {
  type: SyntaxType.Spread;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
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
  restNode?: IdentifierPatternNode;
}

export interface StructTypeNode extends NamedNodeBase {
  type: SyntaxType.StructType;
  memberNodes: MemberTypeNode[];
}

export interface SubtractionTypeNode extends NamedNodeBase {
  type: SyntaxType.SubtractionType;
  leftNode: ParametricTypeNode | UnionTypeNode;
  rightNode: ParametricTypeNode | UnionTypeNode;
}

export interface TaggedPatternNode extends NamedNodeBase {
  type: SyntaxType.TaggedPattern;
  nameNode: IdentifierNode;
  patternNode: BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode;
}

export interface TaggedTypeNode extends NamedNodeBase {
  type: SyntaxType.TaggedType;
  nameNode: IdentifierPatternNameNode;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface TernaryNode extends NamedNodeBase {
  type: SyntaxType.Ternary;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  conditionNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  elseNode?: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface TupleNode extends NamedNodeBase {
  type: SyntaxType.Tuple;
  elementNodes: (AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode)[];
}

export interface TuplePatternNode extends NamedNodeBase {
  type: SyntaxType.TuplePattern;
  elementNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode)[];
  restNode?: IdentifierPatternNode;
}

export interface TupleTypeNode extends NamedNodeBase {
  type: SyntaxType.TupleType;
  elementNodes: (AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode)[];
}

export interface TypeAliasNode extends NamedNodeBase {
  type: SyntaxType.TypeAlias;
  elementNodes: IdentifierPatternNode[];
  nameNode: TypeNode;
  parameterNodes: TypeVariableDeclarationNode[];
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface TypeGroupNode extends NamedNodeBase {
  type: SyntaxType.TypeGroup;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface TypeHintNode extends NamedNodeBase {
  type: SyntaxType.TypeHint;
  typeNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  valueNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
}

export interface TypeVariableDeclarationNode extends NamedNodeBase {
  type: SyntaxType.TypeVariableDeclaration;
  constraintNodes: (AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode)[];
  nameNode: TypeVariableDeclarationNameNode;
}

export interface TypeofNode extends NamedNodeBase {
  type: SyntaxType.Typeof;
  valueNode: BooleanNode | IdentifierNode | NumberNode | RegexNode | StringNode;
}

export interface UnionTypeNode extends NamedNodeBase {
  type: SyntaxType.UnionType;
  leftNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
  rightNode: AccessTypeNode | ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | RefinementTypeNode | RefinementTypeDeclarationNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | TypeofNode | UnionTypeNode;
}

export interface WhenNode extends NamedNodeBase {
  type: SyntaxType.When;
  bodyNode: AbstractionNode | AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ExportNode | GroupNode | HoleNode | IdentifierNode | IfNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | NumberNode | ParametricTypeInstanceNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StringNode | StructNode | TernaryNode | TupleNode | TypeAliasNode | TypeHintNode;
  patternNodes: (BooleanNode | DestructuringPatternNode | IdentifierPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | TaggedPatternNode | WildcardPatternNode)[];
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

export interface TypeVariableDeclarationNameNode extends NamedNodeBase {
  type: SyntaxType.TypeVariableDeclarationName;
}

export interface WildcardPatternNode extends NamedNodeBase {
  type: SyntaxType.WildcardPattern;
}

