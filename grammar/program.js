module.exports = {
  program: ($) =>
    seq(
      optional(field('hashBangLine', $.hashBangLine)),
      optional(repeat1(field('term', $._term))),
    ),
  hashBangLine: () => /#!.*/,

  comment: () => token(seq('#', /.*/)),
}
