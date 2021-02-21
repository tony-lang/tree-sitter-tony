const { hash_bang_line, comment } = require('../common/miscellaneous')
const {
  import_,
  exported_import,
  _import_body_constructor,
  import_identifier,
  import_type,
} = require('../common/imports')
const {
  _term,
  _simple_term,
  _compound_term,
  _simple_block,
  _compound_block,
  simple_export,
  compound_export,
  simple_assignment,
  compound_assignment,
  enum_,
  enum_value,
  class_,
  class_member,
  instance,
  argument,
  simple_abstraction,
  simple_abstraction_branch,
  compound_abstraction,
  compound_abstraction_branch,
  application,
  prefix_application,
  infix_application,
  _section,
  left_section,
  right_section,
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
  tagged_value,
  type_alias,
  type_hint,
  _identifier_without_operators,
  _operator,
  identifier,
  _section_identifier,
  group,
} = require('../common/terms')
const {
  _pattern,
  _assignable_pattern,
  destructuring_pattern,
  struct_pattern,
  tuple_pattern,
  list_pattern,
  member_pattern,
  identifier_pattern,
  tagged_pattern,
  _literal_pattern,
  pattern_group,
} = require('../common/patterns')
const {
  type_variable_declaration,
  _type_constructor,
  _term_type,
  typeof_,
  parametric_type_constructor,
  curried_type,
  intersection_type,
  union_type,
  subtraction_type,
  conditional_type,
  struct_type,
  member_type,
  map_type,
  tuple_type,
  list_type,
  access_type,
  tagged_type,
  labeled_type,
  keyof,
  refinement_type_declaration,
  refinement_type,
  _predicate,
  type_declaration,
  type_group,
  type,
} = require('../common/types')
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
} = require('../common/literals')

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
    [$.tagged_value, $.tagged_pattern],
    [$.tagged_value, $.tagged_pattern, $.tagged_type],
    [$.tagged_value, $.tagged_type],
    [$.tagged_pattern, $.tagged_type],
  ],

  rules: {
    program: ($) =>
      seq(
        optional(field('hashBangLine', $.hash_bang_line)),
        repeat(field('import', choice($.import, $.exported_import))),
        repeat(field('term', $._term)),
      ),

    hash_bang_line,
    comment,

    import: import_,
    exported_import,
    _import_body: _import_body_constructor('tony'),
    import_identifier,
    import_type,

    _term,
    _simple_term,
    _compound_term,
    _simple_block,
    _compound_block,
    simple_export,
    compound_export,
    simple_assignment,
    compound_assignment,
    enum: enum_,
    enum_value,
    class: class_,
    class_member,
    instance,
    argument,
    simple_abstraction,
    simple_abstraction_branch,
    compound_abstraction,
    compound_abstraction_branch,
    application,
    prefix_application,
    infix_application,
    _section,
    left_section,
    right_section,
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
    tagged_value,
    type_alias,
    type_hint,
    _identifier_without_operators,
    _operator,
    identifier,
    _section_identifier,
    group,

    _pattern,
    _assignable_pattern,
    destructuring_pattern,
    struct_pattern,
    tuple_pattern,
    list_pattern,
    member_pattern,
    identifier_pattern,
    tagged_pattern,
    _literal_pattern,
    pattern_group,

    type_variable_declaration,
    _type: _type_constructor('tony'),
    _term_type,
    typeof: typeof_,
    parametric_type: parametric_type_constructor('tony'),
    curried_type,
    intersection_type,
    union_type,
    subtraction_type,
    conditional_type,
    struct_type,
    member_type,
    map_type,
    tuple_type,
    list_type,
    access_type,
    tagged_type,
    labeled_type,
    keyof,
    refinement_type_declaration,
    refinement_type,
    _predicate,
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
