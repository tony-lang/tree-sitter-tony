/// <reference types="tree-sitter-cli/dsl" />

import {
  _decimal,
  _integer,
  boolean,
  number,
  raw_string,
  regex,
  regex_flags,
  regex_pattern,
} from '../common/literals'
import {
  _identifier_without_operators,
  _operator,
  identifier,
} from '../common/terms'
import {
  _import_body_constructor,
  import_,
  import_type,
} from '../common/imports'
import {
  _type_constructor,
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
  struct_type,
  subtraction_type,
  tagged_type,
  tuple_type,
  type,
  type_group,
  type_variable_declaration,
  union_type,
} from '../common/types'
import { declaration, declaration_member } from '../common/declarations'
import { Dialect } from '../common/enums'
import { comment } from '../common/miscellaneous'

const dialect = Dialect.DTN

export = grammar({
  name: 'dtn',

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

  precedences: () => [],

  rules: {
    program: ($) =>
      seq(
        repeat(field('import', $.import)),
        field('declaration', $.declaration),
      ),

    comment,

    declaration,
    declaration_member,

    import: import_,
    _import_body: _import_body_constructor(dialect),
    import_type,

    _identifier_without_operators,
    _operator,
    identifier,

    type_variable_declaration,
    _type: _type_constructor(dialect),
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
    tagged_type,
    labeled_type,
    keyof,
    type_group,
    type,

    boolean,
    _decimal,
    _integer,
    number,
    raw_string,
    regex,
    regex_pattern,
    regex_flags,
  },
})
