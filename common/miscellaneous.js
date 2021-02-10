module.exports = {
  hash_bang_line: () => /#!.*/,
  comment: () => token(seq('#', /.*/)),
}
