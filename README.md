# tree-sitter-tony

This repository is home to the parser and [Tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar of the Tony programming language. It comes with automatically generated [TypeScript](https://www.typescriptlang.org/) type declarations.

Tony is a functional, strongly typed, high level, general purpose programming language. Tony employs refinement types, allowing its type checker to catch domain-specific bugs at compile time.

Other core components of Tony can be found through the following links:

* [Formal specification](https://github.com/tony-lang/spec)
* [Compiler and Type Inference algorithm](https://github.com/tony-lang/tony)
* [CLI](https://github.com/tony-lang/cli)

**Note of caution**: New features of Tony are discussed in the repository housing the [language spec](https://github.com/tony-lang/spec). This repository merely implements the spec.

Examples for valid syntax can be found in `test/corpus`.

## Philosophy

This project uses [Tree-sitter](https://github.com/tree-sitter/tree-sitter) as a parsing library. As such this repository includes a Tree-sitter grammar (at `grammar.js`). This grammar may be used for any purpose beyond simply parsing the code to compile it. These uses include syntax highlighting, deep integration with code editors and more.

## Installation

**Prerequisites**: Building this parser will require the following tools:

* [Node.js](https://nodejs.org/en/) (the version is specified by the `engines` entry in `package.json`); and
* the [node-gyp](https://www.npmjs.com/package/node-gyp/) build tool.

Alternatively to building the parser yourself you can use prebuilt versions. If available, a prebuilt version will be used automatically when you install this project.

The `tree-sitter-tony` package is published on [NPM](https://www.npmjs.com/package/tree-sitter-tony).

You may install it

* using [Yarn](https://yarnpkg.com/) (preferred)

    ```
    $ yarn add tree-sitter-tony
    ```

* or using [NPM](https://docs.npmjs.com/cli/v6/commands/npm)

    ```
    $ npm install tree-sitter-tony
    ```

* or from source

    ```
    $ git clone git@github.com:tony-lang/tree-sitter-tony.git
    $ yarn setup
    ```

## Usage

The generated parser is in C. There exist [bindings](https://github.com/tree-sitter) to use this parser with a huge variety of programming languages. Below you can find a couple of options of using the parser.

### CLI

To parse a file and emit a syntax tree run

    $ yarn parse file.tn

where `file.tn` is the relative path to the file you want to parse.

### TypeScript / JavaScript

Import the parser with

```ts
import TreeSitterTony, { Parser } from 'tree-sitter-tony
```

Then you are able to create an instance of the parser as follows:

```ts
const parser = new Parser()
parser.setLanguage(TreeSitterTony)
```

Now you can parse any string into an abstract syntax tree:

```ts
const sourceCode: string = await readFile(file)

const tree = parser.parse(sourceCode)
```

`tree` and every child node including their properties are strongly typed.

## Development

To start development you first have to fork this repository and the clone your fork locally.

Then setup the project locally by running:

    $ yarn setup

`grammar.js` houses the specification of the parser. You can generate a new parser from this specification by running:

    $ yarn generate

You can generate type declarations by running:

    $ yarn types

### Testing

To run the tests:

    $ yarn test

To let TypeScript check types:

    $ yarn tsc

The linter can be run as follows:

    $ yarn lint

We use [Prettier](https://prettier.io/) for automated code formatting:

    $ yarn prettier

You can find all commands the CI workflow runs in `.github/workflows/ci.yml`.

## Releases

[Here](https://github.com/tony-lang/tree-sitter-tony/releases/) you can find details on all past releases.
Unreleased breaking changes that are on the current master can be found [here](CHANGELOG.md).

Tony follows Semantic Versioning 2.0 as defined at http://semver.org.

### Publishing

1. Review breaking changes and deprecations in `CHANGELOG.md`
1. Change the version in `package.json`.
1. Reset `CHANGELOG.md`
1. Create a pull request to merge the changes into `master`.
1. After the pull request was merged, create a new release listing the breaking changes, deprecations and commits on `master` since the last release.
1. The release workflow will publish the package to NPM and GPR.
1. The prebuild workflow will upload prebuilt packages to GitHub.
