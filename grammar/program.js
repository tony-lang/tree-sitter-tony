module.exports = {
  program: ($) =>
    seq(
      optional(field('hashBangLine', $.hash_bang_line)),
      optional(repeat1(field('term', $._term))),
    ),
  hash_bang_line: () => /#!.*/,

  comment: () => token(seq('#', /.*/)),
}
