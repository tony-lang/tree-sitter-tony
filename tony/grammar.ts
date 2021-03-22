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
  struct_pattern,
  tagged_pattern,
  tuple_pattern,
} from '../common/patterns'
import {
  block,
  _term,
  _element,
  _identifier_without_operators,
  _operator,
  _section,
  _section_identifier,
  access,
  application,
  argument,
  case_,
  class_,
  class_member,
  abstraction,
  abstraction_branch,
  assignment,
  export_,
  if_,
  else_if,
  list_comprehension_condition,
  list_comprehension_generator,
  group,
  hole,
  identifier,
  infix_application,
  instance,
  left_section,
  list,
  list_comprehension,
  member,
  parametric_type_instance,
  prefix_application,
  return_,
  right_section,
  spread,
  struct,
  tagged_value,
  tuple,
  type_alias,
  type_hint,
  when,
} from '../common/terms'
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
  _import_body_constructor,
  exported_import,
  import_,
  import_identifier,
  import_type,
} from '../common/imports'
import {
  _predicate,
  _term_type,
  _type_constructor,
  access_type,
  conditional_type,
  curried_type,
  intersection_type,
  keyof,
  labeled_type,
  list_type,
  map_type,
  member_type,
  optional_type,
  parametric_type_constructor,
  refinement_type,
  refinement_type_declaration,
  struct_type,
  subtraction_type,
  tagged_type,
  tuple_type,
  type,
  type_group,
  type_variable_declaration,
  typeof_,
  union_type,
} from '../common/types'
import { comment, hash_bang_line } from '../common/miscellaneous'
import { Dialect } from '../common/enums'

const dialect = Dialect.Tony

export = grammar({
  name: 'tony',

  externals: ($) => [$._newline, $._string_start, $._string_content, $._string_end],
  extras: ($) => [$.comment, /\s+/],
  word: ($) => $._identifier_without_operators,
  conflicts: ($) => [
    [$._term, $.identifier_pattern],
    [$._term, $.identifier_pattern, $._type],
    [$._term, $.identifier_pattern, $.struct],
    [$.string, $.raw_string],
    [$.struct, $.struct_pattern],
    [$.struct, $.struct_pattern, $.struct_type],
    [$.tuple, $.tuple_pattern],
    [$.tuple, $.tuple_pattern, $.tuple_type],
    [$.list, $.list_pattern],
    [$.member, $.member_pattern, $._element],
    [$.parametric_type_instance, $.prefix_application, $.infix_application],
    [$.parametric_type_instance, $.infix_application],
    [$.application, $.prefix_application, $.infix_application],
    [$.application, $.infix_application],
    [$.tagged_value, $.tagged_pattern],
    [$.tagged_value, $.tagged_pattern, $.tagged_type],
    [$.tagged_value, $.tagged_type],
    [$.tagged_pattern, $.tagged_type],
    [$.type_variable_declaration, $.parametric_type],
  ],

  precedences: () => [],

  rules: {
    program: ($) =>
      seq(
        optional(seq(field('hashBangLine', $.hash_bang_line), $._newline)),
        repeat(seq(field('import', choice($.import, $.exported_import)), $._newline)),
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
    abstraction,
    abstraction_branch,
    application,
    prefix_application,
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
    tagged_value,
    parametric_type_instance,
    type_alias,
    type_hint,
    hole,
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
    tagged_pattern,
    _literal_pattern,
    pattern_group,

    type_variable_declaration,
    _type: _type_constructor(dialect),
    _term_type,
    typeof: typeof_,
    parametric_type: parametric_type_constructor(dialect),
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
    optional_type,
    access_type,
    tagged_type,
    labeled_type,
    keyof,
    refinement_type_declaration,
    refinement_type,
    _predicate,
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
