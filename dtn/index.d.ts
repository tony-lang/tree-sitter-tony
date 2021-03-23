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
  ConditionalType = "conditional_type",
  CurriedType = "curried_type",
  Declaration = "declaration",
  DeclarationMember = "declaration_member",
  Identifier = "identifier",
  IdentifierPatternName = "identifier_pattern_name",
  Import = "import",
  ImportType = "import_type",
  IntersectionType = "intersection_type",
  Keyof = "keyof",
  LabeledType = "labeled_type",
  ListType = "list_type",
  MapType = "map_type",
  MemberType = "member_type",
  OptionalType = "optional_type",
  ParametricType = "parametric_type",
  Program = "program",
  RawString = "raw_string",
  ShorthandMemberIdentifier = "shorthand_member_identifier",
  StructType = "struct_type",
  SubtractionType = "subtraction_type",
  TaggedType = "tagged_type",
  TupleType = "tuple_type",
  TypeGroup = "type_group",
  UnionType = "union_type",
  Comment = "comment",
  RegexFlags = "regex_flags",
  RegexPattern = "regex_pattern",
  Type = "type",
  TypeVariableDeclarationName = "type_variable_declaration_name",
}

export type UnnamedType =
  | "&"
  | "("
  | "()"
  | ")"
  | ","
  | "/"
  | ":"
  | "::"
  | ";"
  | "<"
  | "<:"
  | "=>"
  | ">"
  | "?"
  | "["
  | "\\"
  | "]"
  | "as"
  | "declare"
  | "false"
  | "from"
  | SyntaxType.Import // both named and unnamed
  | "in"
  | SyntaxType.Keyof // both named and unnamed
  | "r/"
  | "true"
  | "{"
  | "|"
  | "}"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode = 
  | ConditionalTypeNode
  | CurriedTypeNode
  | DeclarationNode
  | DeclarationMemberNode
  | IdentifierNode
  | IdentifierPatternNameNode
  | ImportNode
  | ImportTypeNode
  | IntersectionTypeNode
  | KeyofNode
  | LabeledTypeNode
  | ListTypeNode
  | MapTypeNode
  | MemberTypeNode
  | OptionalTypeNode
  | ParametricTypeNode
  | ProgramNode
  | RawStringNode
  | ShorthandMemberIdentifierNode
  | StructTypeNode
  | SubtractionTypeNode
  | TaggedTypeNode
  | TupleTypeNode
  | TypeGroupNode
  | UnionTypeNode
  | UnnamedNode<"&">
  | UnnamedNode<"(">
  | UnnamedNode<"()">
  | UnnamedNode<")">
  | UnnamedNode<",">
  | UnnamedNode<"/">
  | UnnamedNode<":">
  | UnnamedNode<"::">
  | UnnamedNode<";">
  | UnnamedNode<"<">
  | UnnamedNode<"<:">
  | UnnamedNode<"=>">
  | UnnamedNode<">">
  | UnnamedNode<"?">
  | UnnamedNode<"[">
  | UnnamedNode<"\\">
  | UnnamedNode<"]">
  | UnnamedNode<"as">
  | CommentNode
  | UnnamedNode<"declare">
  | UnnamedNode<"false">
  | UnnamedNode<"from">
  | UnnamedNode<SyntaxType.Import>
  | UnnamedNode<"in">
  | UnnamedNode<SyntaxType.Keyof>
  | UnnamedNode<"r/">
  | RegexFlagsNode
  | RegexPatternNode
  | UnnamedNode<"true">
  | TypeNode
  | TypeVariableDeclarationNameNode
  | UnnamedNode<"{">
  | UnnamedNode<"|">
  | UnnamedNode<"}">
  | ErrorNode
  ;

export interface ConditionalTypeNode extends NamedNodeBase {
  type: SyntaxType.ConditionalType;
  alternativeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  consequenceNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  constraintNodes: (ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode)[];
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface CurriedTypeNode extends NamedNodeBase {
  type: SyntaxType.CurriedType;
  fromNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  toNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface DeclarationNode extends NamedNodeBase {
  type: SyntaxType.Declaration;
  memberNodes: DeclarationMemberNode[];
  nameNode: RawStringNode;
}

export interface DeclarationMemberNode extends NamedNodeBase {
  type: SyntaxType.DeclarationMember;
  asNode: IdentifierPatternNameNode;
  nameNode?: IdentifierPatternNameNode;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface IdentifierPatternNameNode extends NamedNodeBase {
  type: SyntaxType.IdentifierPatternName;
}

export interface ImportNode extends NamedNodeBase {
  type: SyntaxType.Import;
  importNodes: ImportTypeNode[];
  sourceNode: RawStringNode;
}

export interface ImportTypeNode extends NamedNodeBase {
  type: SyntaxType.ImportType;
  asNode: TypeNode;
  nameNode?: TypeNode;
}

export interface IntersectionTypeNode extends NamedNodeBase {
  type: SyntaxType.IntersectionType;
  leftNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  rightNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface KeyofNode extends NamedNodeBase {
  type: SyntaxType.Keyof;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface LabeledTypeNode extends NamedNodeBase {
  type: SyntaxType.LabeledType;
  labelNode: IdentifierNode;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface ListTypeNode extends NamedNodeBase {
  type: SyntaxType.ListType;
  elementNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface MapTypeNode extends NamedNodeBase {
  type: SyntaxType.MapType;
  keyNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  propertyNode?: TypeVariableDeclarationNameNode;
  valueNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface MemberTypeNode extends NamedNodeBase {
  type: SyntaxType.MemberType;
  keyNode: ShorthandMemberIdentifierNode;
  valueNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface OptionalTypeNode extends NamedNodeBase {
  type: SyntaxType.OptionalType;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface ParametricTypeNode extends NamedNodeBase {
  type: SyntaxType.ParametricType;
  argumentNodes: (ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode)[];
  nameNode: TypeNode;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
  declarationNode: DeclarationNode;
  importNodes: ImportNode[];
}

export interface RawStringNode extends NamedNodeBase {
  type: SyntaxType.RawString;
}

export interface ShorthandMemberIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ShorthandMemberIdentifier;
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

export interface TaggedTypeNode extends NamedNodeBase {
  type: SyntaxType.TaggedType;
  nameNode: IdentifierPatternNameNode;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface TupleTypeNode extends NamedNodeBase {
  type: SyntaxType.TupleType;
  elementNodes: (ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode)[];
}

export interface TypeGroupNode extends NamedNodeBase {
  type: SyntaxType.TypeGroup;
  typeNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface UnionTypeNode extends NamedNodeBase {
  type: SyntaxType.UnionType;
  leftNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
  rightNode: ConditionalTypeNode | CurriedTypeNode | IntersectionTypeNode | KeyofNode | LabeledTypeNode | ListTypeNode | MapTypeNode | OptionalTypeNode | ParametricTypeNode | StructTypeNode | SubtractionTypeNode | TaggedTypeNode | TupleTypeNode | TypeGroupNode | UnionTypeNode;
}

export interface CommentNode extends NamedNodeBase {
  type: SyntaxType.Comment;
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

