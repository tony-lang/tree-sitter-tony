#include <tree_sitter/parser.h>
#include <vector>
#include <cwctype>
#include <cstring>
#include <cassert>

namespace {

using std::vector;
using std::iswspace;
using std::memcpy;

enum TokenType {
  NEWLINE,
  STRING_START,
  STRING_CONTENT,
  STRING_END,
};

struct Delimiter {
  enum {
    SingleQuote = 1 << 0,
    DoubleQuote = 1 << 1,
  };

  Delimiter() : flags(0) {}

  int32_t end_character() const {
    if (flags & SingleQuote) return '\'';
    if (flags & DoubleQuote) return '"';
    return 0;
  }

  void set_end_character(int32_t character) {
    switch (character) {
      case '\'':
        flags |= SingleQuote;
        break;
      case '"':
        flags |= DoubleQuote;
        break;
      default:
        assert(false);
    }
  }

  char flags;
};

struct Scanner {
  Scanner() {
    assert(sizeof(Delimiter) == sizeof(char));
    deserialize(NULL, 0);
  }

  unsigned serialize(char *buffer) {
    size_t i = 0;

    size_t stack_size = delimiter_stack.size();
    if (stack_size > UINT8_MAX) stack_size = UINT8_MAX;
    buffer[i++] = stack_size;

    memcpy(&buffer[i], delimiter_stack.data(), stack_size);
    i += stack_size;

    vector<uint16_t>::iterator
      iter = indent_length_stack.begin() + 1,
      end = indent_length_stack.end();

    for (; iter != end && i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; ++iter) {
      buffer[i++] = *iter;
    }

    return i;
  }

  void deserialize(const char *buffer, unsigned length) {
    delimiter_stack.clear();
    indent_length_stack.clear();
    indent_length_stack.push_back(0);

    if (length > 0) {
      size_t i = 0;

      size_t delimiter_count = (uint8_t)buffer[i++];
      delimiter_stack.resize(delimiter_count);
      memcpy(delimiter_stack.data(), &buffer[i], delimiter_count);
      i += delimiter_count;

      for (; i < length; i++) {
        indent_length_stack.push_back(buffer[i]);
      }
    }
  }

  void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
  }

  void skip(TSLexer *lexer) {
    lexer->advance(lexer, true);
  }

  bool scan(TSLexer *lexer, const bool *valid_symbols) {
    if (valid_symbols[STRING_CONTENT] && !delimiter_stack.empty()) {
      Delimiter delimiter = delimiter_stack.back();
      int32_t end_character = delimiter.end_character();
      bool has_content = false;
      while (lexer->lookahead) {
        if (lexer->lookahead == '{') {
          lexer->mark_end(lexer);
          lexer->advance(lexer, false);
          if (lexer->lookahead == '{') {
            lexer->advance(lexer, false);
          } else {
            lexer->result_symbol = STRING_CONTENT;
            return has_content;
          }
        } else if (lexer->lookahead == '\\') {
          lexer->mark_end(lexer);
          lexer->result_symbol = STRING_CONTENT;
          return has_content;
        } else if (lexer->lookahead == end_character) {
          if (has_content) {
            lexer->result_symbol = STRING_CONTENT;
          } else {
            lexer->advance(lexer, false);
            delimiter_stack.pop_back();
            lexer->result_symbol = STRING_END;
          }
          lexer->mark_end(lexer);
          return true;
        } else if (lexer->lookahead == '\n' && has_content) {
          return false;
        }
        advance(lexer);
        has_content = true;
      }
    }

    lexer->mark_end(lexer);

    bool has_comment = false;
    bool has_newline = false;
    uint32_t indent_length = 0;
    for (;;) {
      if (lexer->lookahead == '\n') {
        has_newline = true;
        indent_length = 0;
        skip(lexer);
      } else if (lexer->lookahead == ' ') {
        indent_length++;
        skip(lexer);
      } else if (lexer->lookahead == '\r') {
        indent_length = 0;
        skip(lexer);
      } else if (lexer->lookahead == '\t') {
        indent_length += 8;
        skip(lexer);
      } else if (lexer->lookahead == '#') {
        has_comment = true;
        while (lexer->lookahead && lexer->lookahead != '\n') skip(lexer);
        skip(lexer);
        indent_length = 0;
      } else if (lexer->lookahead == '\\') {
        skip(lexer);
        if (iswspace(lexer->lookahead)) {
          skip(lexer);
        } else {
          return false;
        }
      } else if (lexer->lookahead == 0) {
        if (valid_symbols[NEWLINE]) {
          lexer->result_symbol = NEWLINE;
          return true;
        }

        break;
      } else {
        break;
      }
    }

    if (has_newline) {
      if (valid_symbols[NEWLINE]) {
        lexer->result_symbol = NEWLINE;
        return true;
      }
    }

    if (!has_comment && valid_symbols[STRING_START]) {
      Delimiter delimiter;

      if (lexer->lookahead == '\'') {
        delimiter.set_end_character('\'');
        advance(lexer);
        lexer->mark_end(lexer);
      } else if (lexer->lookahead == '"') {
        delimiter.set_end_character('"');
        advance(lexer);
        lexer->mark_end(lexer);
      }

      if (delimiter.end_character()) {
        delimiter_stack.push_back(delimiter);
        lexer->result_symbol = STRING_START;
        return true;
      }
    }

    return false;
  }

  vector<uint16_t> indent_length_stack;
  vector<Delimiter> delimiter_stack;
};

}
