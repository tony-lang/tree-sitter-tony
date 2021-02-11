{
  "targets": [
    {
      "target_name": "tree_sitter_tony_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "tony/src"
      ],
      "sources": [
        "tony/src/parser.c",
        "tony/src/scanner.cc",
        "tony/src/binding.cc"
      ],
      "cflags_c": [
        "-std=c99",
      ]
    },
    {
      "target_name": "tree_sitter_dtn_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "dtn/src"
      ],
      "sources": [
        "dtn/src/parser.c",
        "dtn/src/scanner.cc",
        "dtn/src/binding.cc"
      ],
      "cflags_c": [
        "-std=c99",
      ]
    },
  ]
}
