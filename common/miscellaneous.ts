export const hash_bang_line = () => /#!.*/
export const comment = () => token(seq('#', /.*/))
