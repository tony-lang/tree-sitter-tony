/// <reference types="tree-sitter-cli/dsl" />

import {
  _assignable_pattern,
  _literal_pattern,
  _pattern,
  destructuring_pattern,
  identifier_pattern,
  list_pattern,
  member_pattern,
  pattern_group,
  root_identifier_pattern,
  struct_pattern,
  tagged_pattern,
  tuple_pattern,
  wildcard_pattern,
} from '../common/patterns'
import {
  _decimal,
  _integer,
  _literal,
  boolean,
  escape_sequence,
  interpolation,
  number,
  raw_string,
  regex,
  regex_flags,
  regex_pattern,
  string,
} from '../common/literals'
import {
  _element,
  _identifier_without_operators,
  _operator,
  _section,
  _section_identifier,
  _term,
  function_,
  access,
  application,
  argument,
  assignment,
  block,
  case_,
  class_,
  class_member,
  else_if,
  export_,
  group,
  hole,
  identifier,
  if_,
  infix_application,
  instance,
  left_section,
  list,
  list_comprehension,
  list_comprehension_condition,
  list_comprehension_generator,
  member,
  parametric_type_instance,
  pure,
  return_,
  right_section,
  spread,
  struct,
  ternary,
  tuple,
  data,
  data_constructor,
  function_type,
  optional_type,
  map_type,
  keyof_type,
  type,
  type_variable_declaration,
  type_hint,
  when,
} from '../common/terms'
import {
  _import_body_constructor,
  exported_import,
  import_,
  import_identifier,
  import_type,
} from '../common/imports'
import { comment, hash_bang_line } from '../common/miscellaneous'
import { Dialect } from '../common/enums'

const dialect = Dialect.Tony

export = grammar({
  name: 'tony',

  externals: ($) => [
    $._newline,
    $._string_start,
    $._string_content,
    $._string_end,
  ],
  extras: ($) => [$.comment, /\s+/],
  word: ($) => $._identifier_without_operators,
  conflicts: ($) => [
    [$._term, $.identifier_pattern],
    [$._term, $.identifier_pattern, $.root_identifier_pattern],
    [$.identifier_pattern, $.root_identifier_pattern],
    // [
    //   $.identifier_pattern,
    //   $.root_identifier_pattern,
    //   $.refinement_type_declaration,
    // ],
    [$._term, $.root_identifier_pattern],
    // [$._term, $.identifier_pattern, $._type],
    [$._term, $.identifier_pattern, $.struct],
    [$.string, $.raw_string],
    [$.struct, $.struct_pattern],
    // [$.struct, $.struct_pattern, $.struct_type],
    [$.tuple, $.tuple_pattern],
    // [$.tuple, $.tuple_pattern, $.tuple_type],
    [$.list, $.list_pattern],
    // [$.abstraction, $.tuple_type],
    [$.member, $.member_pattern, $._element],
    [$.member, $.member_pattern, $._element, $.map_type],
    [$.member, $.map_type],
    [$.parametric_type_instance, $.infix_application],
    [$.parametric_type_instance, $.infix_application, $.application],
    [$.application, $.infix_application],
    [$.application, $.infix_application, $.ternary],
    [$.application, $.infix_application, $.ternary, $.optional_type],
    [$.application, $.assignment, $.ternary],
    // [$.application, $.assignment, $.ternary, $.optional_type],
    [$.tagged_pattern, $.identifier],
    // [$.tagged_pattern, $.tagged_type],
    // [$.type_variable_declaration, $.parametric_type],
    [$._element, $.group],
    [$.data_constructor, $.identifier],
    [$.data_constructor, $.identifier, $.tagged_pattern],
  ],

  precedences: () => [],

  rules: {
    program: ($) =>
      seq(
        optional(seq(field('hashBangLine', $.hash_bang_line), $._newline)),
        repeat(
          seq(field('import', choice($.import, $.exported_import)), $._newline),
        ),
        repeat(seq(field('term', $._term), $._newline)),
      ),

    hash_bang_line,
    comment,

    import: import_,
    exported_import,
    _import_body: _import_body_constructor(dialect),
    import_identifier,
    import_type,

    _term,
    block,
    export: export_,
    assignment,
    class: class_,
    class_member,
    instance,
    argument,
    function: function_,
    application,
    infix_application,
    _section,
    left_section,
    right_section,
    _section_identifier,
    list_comprehension,
    list_comprehension_generator,
    list_comprehension_condition,
    access,
    return: return_,
    ternary,
    if: if_,
    else_if,
    case: case_,
    when,
    struct,
    member,
    tuple,
    list,
    _element,
    spread,
    parametric_type_instance,
    pure,
    hole,
    type_hint,
    data,
    data_constructor,
    type_variable_declaration,
    function_type,
    optional_type,
    map_type,
    keyof_type,
    type,
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
    identifier_pattern,
    root_identifier_pattern,
    wildcard_pattern,
    tagged_pattern,
    _literal_pattern,
    pattern_group,

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
