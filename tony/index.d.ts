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
  Access = "access",
  Application = "application",
  Argument = "argument",
  Assignment = "assignment",
  BindingPattern = "binding_pattern",
  Block = "block",
  Boolean = "boolean",
  Case = "case",
  Class = "class",
  ClassMember = "class_member",
  Conditional = "conditional",
  Data = "data",
  DestructuringPattern = "destructuring_pattern",
  Export = "export",
  ExportedImport = "exported_import",
  ExtendsType = "extends_type",
  Function = "function",
  FunctionType = "function_type",
  Generator = "generator",
  Group = "group",
  Hole = "hole",
  Identifier = "identifier",
  IdentifierPattern = "identifier_pattern",
  Import = "import",
  ImportIdentifier = "import_identifier",
  ImportType = "import_type",
  InfixApplication = "infix_application",
  Instance = "instance",
  Interpolation = "interpolation",
  LeftSection = "left_section",
  List = "list",
  ListComprehension = "list_comprehension",
  ListPattern = "list_pattern",
  MapType = "map_type",
  Member = "member",
  MemberPattern = "member_pattern",
  Number = "number",
  OptionalType = "optional_type",
  PatternGroup = "pattern_group",
  Program = "program",
  Pure = "pure",
  RawString = "raw_string",
  Regex = "regex",
  Return = "return",
  RightSection = "right_section",
  ShorthandAccessIdentifier = "shorthand_access_identifier",
  ShorthandMember = "shorthand_member",
  ShorthandMemberIdentifier = "shorthand_member_identifier",
  ShorthandMemberPattern = "shorthand_member_pattern",
  Spread = "spread",
  StaticApplication = "static_application",
  StaticFunction = "static_function",
  String = "string",
  Struct = "struct",
  StructPattern = "struct_pattern",
  Tag = "tag",
  TagPattern = "tag_pattern",
  Tuple = "tuple",
  TuplePattern = "tuple_pattern",
  TypeHint = "type_hint",
  When = "when",
  Comment = "comment",
  EscapeSequence = "escape_sequence",
  HashBangLine = "hash_bang_line",
  RegexFlags = "regex_flags",
  RegexPattern = "regex_pattern",
  Type = "type",
  TypePattern = "type_pattern",
  WildcardPattern = "wildcard_pattern",
}

export type UnnamedType =
  | "("
  | "()"
  | ")"
  | ","
  | "->"
  | "..."
  | "/"
  | ":"
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
  | SyntaxType.Class // both named and unnamed
  | SyntaxType.Data // both named and unnamed
  | "else"
  | SyntaxType.Export // both named and unnamed
  | "false"
  | "from"
  | SyntaxType.Import // both named and unnamed
  | "in"
  | SyntaxType.Instance // both named and unnamed
  | "of"
  | SyntaxType.Pure // both named and unnamed
  | "r/"
  | SyntaxType.Return // both named and unnamed
  | "then"
  | "true"
  | SyntaxType.When // both named and unnamed
  | "{"
  | "|"
  | "}"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode = 
  | AccessNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BindingPatternNode
  | BlockNode
  | BooleanNode
  | CaseNode
  | ClassNode
  | ClassMemberNode
  | ConditionalNode
  | DataNode
  | DestructuringPatternNode
  | ExportNode
  | ExportedImportNode
  | ExtendsTypeNode
  | FunctionNode
  | FunctionTypeNode
  | GeneratorNode
  | GroupNode
  | HoleNode
  | IdentifierNode
  | IdentifierPatternNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode
  | InfixApplicationNode
  | InstanceNode
  | InterpolationNode
  | LeftSectionNode
  | ListNode
  | ListComprehensionNode
  | ListPatternNode
  | MapTypeNode
  | MemberNode
  | MemberPatternNode
  | NumberNode
  | OptionalTypeNode
  | PatternGroupNode
  | ProgramNode
  | PureNode
  | RawStringNode
  | RegexNode
  | ReturnNode
  | RightSectionNode
  | ShorthandAccessIdentifierNode
  | ShorthandMemberNode
  | ShorthandMemberIdentifierNode
  | ShorthandMemberPatternNode
  | SpreadNode
  | StaticApplicationNode
  | StaticFunctionNode
  | StringNode
  | StructNode
  | StructPatternNode
  | TagNode
  | TagPatternNode
  | TupleNode
  | TuplePatternNode
  | TypeHintNode
  | WhenNode
  | UnnamedNode<"(">
  | UnnamedNode<"()">
  | UnnamedNode<")">
  | UnnamedNode<",">
  | UnnamedNode<"->">
  | UnnamedNode<"...">
  | UnnamedNode<"/">
  | UnnamedNode<":">
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
  | UnnamedNode<SyntaxType.Class>
  | CommentNode
  | UnnamedNode<SyntaxType.Data>
  | UnnamedNode<"else">
  | EscapeSequenceNode
  | UnnamedNode<SyntaxType.Export>
  | UnnamedNode<"false">
  | UnnamedNode<"from">
  | HashBangLineNode
  | UnnamedNode<SyntaxType.Import>
  | UnnamedNode<"in">
  | UnnamedNode<SyntaxType.Instance>
  | UnnamedNode<"of">
  | UnnamedNode<SyntaxType.Pure>
  | UnnamedNode<"r/">
  | RegexFlagsNode
  | RegexPatternNode
  | UnnamedNode<SyntaxType.Return>
  | UnnamedNode<"then">
  | UnnamedNode<"true">
  | TypeNode
  | TypePatternNode
  | UnnamedNode<SyntaxType.When>
  | WildcardPatternNode
  | UnnamedNode<"{">
  | UnnamedNode<"|">
  | UnnamedNode<"}">
  | ErrorNode
  ;

export interface AccessNode extends NamedNodeBase {
  type: SyntaxType.Access;
  leftNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  rightNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandAccessIdentifierNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface ApplicationNode extends NamedNodeBase {
  type: SyntaxType.Application;
  elementNodes: (AccessNode | ApplicationNode | ArgumentNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
  nameNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  restNode?: BindingPatternNode;
}

export interface ArgumentNode extends NamedNodeBase {
  type: SyntaxType.Argument;
  placeholderNode?: UnnamedNode<"?">;
  valueNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface AssignmentNode extends NamedNodeBase {
  type: SyntaxType.Assignment;
  patternNode: BindingPatternNode | DestructuringPatternNode | PatternGroupNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface BindingPatternNode extends NamedNodeBase {
  type: SyntaxType.BindingPattern;
  defaultNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  nameNode: IdentifierPatternNode | TypePatternNode;
  typeNode?: TypeNode;
}

export interface BlockNode extends NamedNodeBase {
  type: SyntaxType.Block;
  termNodes: (AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
}

export interface BooleanNode extends NamedNodeBase {
  type: SyntaxType.Boolean;
}

export interface CaseNode extends NamedNodeBase {
  type: SyntaxType.Case;
  elseNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  whenNodes: WhenNode[];
}

export interface ClassNode extends NamedNodeBase {
  type: SyntaxType.Class;
  constraintNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  memberNodes: ClassMemberNode[];
  nameNode: TypeNode;
}

export interface ClassMemberNode extends NamedNodeBase {
  type: SyntaxType.ClassMember;
  nameNode: IdentifierPatternNode;
  typeNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface ConditionalNode extends NamedNodeBase {
  type: SyntaxType.Conditional;
  bodyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  conditionNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  elseNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface DataNode extends NamedNodeBase {
  type: SyntaxType.Data;
  constructorNodes: TagNode[];
  nameNode: TypeNode;
  parameterNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
}

export interface DestructuringPatternNode extends NamedNodeBase {
  type: SyntaxType.DestructuringPattern;
  aliasNode?: IdentifierPatternNode | TypePatternNode;
  patternNode: ListPatternNode | StructPatternNode | TagPatternNode | TuplePatternNode;
}

export interface ExportNode extends NamedNodeBase {
  type: SyntaxType.Export;
  declarationNode: AssignmentNode;
}

export interface ExportedImportNode extends NamedNodeBase {
  type: SyntaxType.ExportedImport;
  defaultNode?: IdentifierPatternNode;
  importNodes: (ImportIdentifierNode | ImportTypeNode)[];
  sourceNode: RawStringNode;
}

export interface ExtendsTypeNode extends NamedNodeBase {
  type: SyntaxType.ExtendsType;
  leftNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  rightNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface FunctionNode extends NamedNodeBase {
  type: SyntaxType.Function;
  bodyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  elementNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
  restNode?: BindingPatternNode;
}

export interface FunctionTypeNode extends NamedNodeBase {
  type: SyntaxType.FunctionType;
  fromNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  toNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface GeneratorNode extends NamedNodeBase {
  type: SyntaxType.Generator;
  nameNode: IdentifierPatternNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface GroupNode extends NamedNodeBase {
  type: SyntaxType.Group;
  termNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface HoleNode extends NamedNodeBase {
  type: SyntaxType.Hole;
  nameNode: IdentifierPatternNode;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface IdentifierPatternNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPattern;
}

export interface ImportNode extends NamedNodeBase {
  type: SyntaxType.Import;
  defaultNode?: IdentifierPatternNode;
  importNodes: (ImportIdentifierNode | ImportTypeNode)[];
  sourceNode: RawStringNode;
}

export interface ImportIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ImportIdentifier;
  asNode: IdentifierPatternNode;
  nameNode?: IdentifierPatternNode;
}

export interface ImportTypeNode extends NamedNodeBase {
  type: SyntaxType.ImportType;
  asNode: TypeNode;
  nameNode?: TypeNode;
}

export interface InfixApplicationNode extends NamedNodeBase {
  type: SyntaxType.InfixApplication;
  leftNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  nameNode: IdentifierNode;
  rightNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface InstanceNode extends NamedNodeBase {
  type: SyntaxType.Instance;
  assignmentNodes: AssignmentNode[];
  classNode: TypeNode;
  typeNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface InterpolationNode extends NamedNodeBase {
  type: SyntaxType.Interpolation;
  termNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface LeftSectionNode extends NamedNodeBase {
  type: SyntaxType.LeftSection;
  nameNode: IdentifierNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface ListNode extends NamedNodeBase {
  type: SyntaxType.List;
  elementNodes: (AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
}

export interface ListComprehensionNode extends NamedNodeBase {
  type: SyntaxType.ListComprehension;
  bodyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  conditionNodes: (AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
  generatorNodes: GeneratorNode[];
}

export interface ListPatternNode extends NamedNodeBase {
  type: SyntaxType.ListPattern;
  elementNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
  restNode?: BindingPatternNode;
}

export interface MapTypeNode extends NamedNodeBase {
  type: SyntaxType.MapType;
  keyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  propertyNode?: TypePatternNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface MemberNode extends NamedNodeBase {
  type: SyntaxType.Member;
  keyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandMemberIdentifierNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface MemberPatternNode extends NamedNodeBase {
  type: SyntaxType.MemberPattern;
  keyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | ShorthandMemberIdentifierNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  valueNode: BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode;
}

export interface NumberNode extends NamedNodeBase {
  type: SyntaxType.Number;
}

export interface OptionalTypeNode extends NamedNodeBase {
  type: SyntaxType.OptionalType;
  typeNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface PatternGroupNode extends NamedNodeBase {
  type: SyntaxType.PatternGroup;
  patternNode: BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
  hashBangLineNode?: HashBangLineNode;
  importNodes: (ExportedImportNode | ImportNode)[];
  termNodes: (AccessNode | ApplicationNode | AssignmentNode | BlockNode | BooleanNode | CaseNode | ClassNode | ConditionalNode | DataNode | ExportNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | InstanceNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
}

export interface PureNode extends NamedNodeBase {
  type: SyntaxType.Pure;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface RawStringNode extends NamedNodeBase {
  type: SyntaxType.RawString;
}

export interface RegexNode extends NamedNodeBase {
  type: SyntaxType.Regex;
  flagsNode?: RegexFlagsNode;
  patternNode: RegexPatternNode;
}

export interface ReturnNode extends NamedNodeBase {
  type: SyntaxType.Return;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface RightSectionNode extends NamedNodeBase {
  type: SyntaxType.RightSection;
  nameNode: IdentifierNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
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
  defaultNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  nameNode: IdentifierPatternNode | TypePatternNode;
  typeNode?: TypeNode;
}

export interface SpreadNode extends NamedNodeBase {
  type: SyntaxType.Spread;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface StaticApplicationNode extends NamedNodeBase {
  type: SyntaxType.StaticApplication;
  argumentNodes: (AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface StaticFunctionNode extends NamedNodeBase {
  type: SyntaxType.StaticFunction;
  parameterNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
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
  restNode?: BindingPatternNode;
}

export interface TagNode extends NamedNodeBase {
  type: SyntaxType.Tag;
  nameNode: IdentifierPatternNode;
  typeNode?: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface TagPatternNode extends NamedNodeBase {
  type: SyntaxType.TagPattern;
  nameNode: IdentifierNode;
  patternNode: BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode;
}

export interface TupleNode extends NamedNodeBase {
  type: SyntaxType.Tuple;
  elementNodes: (AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | SpreadNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode)[];
}

export interface TuplePatternNode extends NamedNodeBase {
  type: SyntaxType.TuplePattern;
  elementNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
  restNode?: BindingPatternNode;
}

export interface TypeHintNode extends NamedNodeBase {
  type: SyntaxType.TypeHint;
  typeNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  valueNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
}

export interface WhenNode extends NamedNodeBase {
  type: SyntaxType.When;
  bodyNode: AccessNode | ApplicationNode | BlockNode | BooleanNode | CaseNode | ConditionalNode | ExtendsTypeNode | FunctionNode | FunctionTypeNode | GroupNode | HoleNode | IdentifierNode | InfixApplicationNode | LeftSectionNode | ListNode | ListComprehensionNode | MapTypeNode | NumberNode | OptionalTypeNode | PureNode | RegexNode | ReturnNode | RightSectionNode | StaticApplicationNode | StaticFunctionNode | StringNode | StructNode | TupleNode | TypeNode | TypeHintNode;
  patternNodes: (BindingPatternNode | BooleanNode | DestructuringPatternNode | NumberNode | PatternGroupNode | RawStringNode | RegexNode | WildcardPatternNode)[];
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

export interface TypePatternNode extends NamedNodeBase {
  type: SyntaxType.TypePattern;
}

export interface WildcardPatternNode extends NamedNodeBase {
  type: SyntaxType.WildcardPattern;
}

