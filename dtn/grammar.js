const { comment } = require('../common/miscellaneous')
const { declaration, declaration_member } = require('../common/declarations')
const {
  import_,
  _import_body_constructor,
  import_type,
} = require('../common/imports')
const {
  _identifier_without_operators,
  _operator,
  identifier,
} = require('../common/terms')
const {
  type_variable_declaration,
  _type_constructor,
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
  optional_type,
  tagged_type,
  labeled_type,
  keyof,
  type_group,
  type,
} = require('../common/types')
const {
  boolean,
  _decimal,
  _integer,
  number,
  raw_string,
  regex,
  regex_pattern,
  regex_flags,
} = require('../common/literals')

module.exports = grammar({
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
    _import_body: _import_body_constructor('dtn'),
    import_type,

    _identifier_without_operators,
    _operator,
    identifier,

    type_variable_declaration,
    _type: _type_constructor('dtn'),
    parametric_type: parametric_type_constructor('dtn'),
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
