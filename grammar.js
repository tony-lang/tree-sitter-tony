const { program, hash_bang_line, comment } = require('./grammar/program')
const {
  _term,
  _simple_term,
  _compound_term,
  _simple_block,
  _compound_block,
  import_,
  exported_import,
  _import_body,
  import_identifier,
  import_type,
  simple_export,
  compound_export,
  simple_assignment,
  compound_assignment,
  enum_,
  enum_value,
  interface_,
  implement,
  argument,
  simple_abstraction,
  simple_abstraction_branch,
  compound_abstraction,
  compound_abstraction_branch,
  application,
  prefix_application,
  infix_application,
  list_comprehension,
  generator,
  pipeline,
  access,
  return_,
  simple_if,
  compound_if,
  else_if,
  case_,
  when,
  struct,
  member,
  tuple,
  list,
  _element,
  spread,
  named_value,
  type_alias,
  type_hint,
  _identifier_without_operators,
  _operator,
  identifier,
  group,
} = require('./grammar/terms')
const {
  _literal,
  boolean,
  _decimal,
  _integer,
  number,
  raw_string,
  string,
  interpolation,
  escape_sequence,
  regex,
  regex_pattern,
  regex_flags,
} = require('./grammar/literals')
const {
  _pattern,
  _assignable_pattern,
  destructuring_pattern,
  struct_pattern,
  tuple_pattern,
  list_pattern,
  member_pattern,
  rest,
  identifier_pattern,
  named_pattern,
  _literal_pattern,
  pattern_group,
} = require('./grammar/patterns')
const {
  type_variable_declaration,
  _type,
  typeof_,
  parametric_type,
  curried_type,
  intersection_type,
  union_type,
  struct_type,
  member_type,
  tuple_type,
  list_type,
  named_type,
  refinement_type_declaration,
  refinement_type,
  type_declaration,
  type_group,
  type,
} = require('./grammar/types')

module.exports = grammar({
  name: 'tony',

  externals: ($) => [
    $._newline,
    $._indent,
    $._dedent,
    $._string_start,
    $._string_content,
    $._string_end,
  ],
  extras: ($) => [$.comment, /\s+/],
  word: ($) => $._identifier_without_operators,
  conflicts: ($) => [
    [$._simple_term, $.identifier_pattern],
    [$._simple_term, $.identifier_pattern, $._type],
    [$.string, $.raw_string],
    [$.struct, $.struct_pattern],
    [$.struct, $.struct_pattern, $.struct_type],
    [$.tuple, $.tuple_pattern],
    [$.tuple, $.tuple_pattern, $.tuple_type],
    [$.list, $.list_pattern],
    [$.application, $.prefix_application, $.infix_application],
    [$.application, $.infix_application],
  ],

  rules: {
    program,
    hash_bang_line,
    comment,

    _term,
    _simple_term,
    _compound_term,
    _simple_block,
    _compound_block,
    import: import_,
    exported_import,
    _import_body,
    import_identifier,
    import_type,
    simple_export,
    compound_export,
    simple_assignment,
    compound_assignment,
    enum: enum_,
    enum_value,
    interface: interface_,
    implement,
    argument,
    simple_abstraction,
    simple_abstraction_branch,
    compound_abstraction,
    compound_abstraction_branch,
    application,
    prefix_application,
    infix_application,
    list_comprehension,
    generator,
    pipeline,
    access,
    return: return_,
    simple_if,
    compound_if,
    else_if,
    case: case_,
    when,
    struct,
    member,
    tuple,
    list,
    _element,
    spread,
    named_value,
    type_alias,
    type_hint,
    _identifier_without_operators,
    _operator,
    identifier,
    group,

    _pattern,
    _assignable_pattern,
    destructuring_pattern,
    struct_pattern,
    tuple_pattern,
    list_pattern,
    member_pattern,
    rest,
    identifier_pattern,
    named_pattern,
    _literal_pattern,
    pattern_group,

    type_variable_declaration,
    _type,
    typeof: typeof_,
    parametric_type,
    curried_type,
    intersection_type,
    union_type,
    struct_type,
    member_type,
    tuple_type,
    list_type,
    named_type,
    refinement_type_declaration,
    refinement_type,
    type_declaration,
    type_group,
    type,

    _literal,
    boolean,
    _decimal,
    _integer,
    number,
    raw_string,
    string,
    interpolation,
    escape_sequence,
    regex,
    regex_pattern,
    regex_flags,
  },
})
