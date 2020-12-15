module.exports = {
  program: ($) =>
    seq(
      optional(field('hashBangLine', $.hashBangLine)),
      optional(repeat1(field('expression', $._expression))),
    ),
  hashBangLine: () => /#!.*/,

  comment: () => token(seq('#', /.*/)),
}
