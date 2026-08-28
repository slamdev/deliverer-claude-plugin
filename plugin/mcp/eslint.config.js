// ESLint's flat configuration for the plugin's Node code.
//
// Two layers, exactly as the project asked for them: `js.configs.recommended` over everything, and
// `tseslint.configs.recommended` over the TypeScript sources.
//
// `TYPESCRIPT_SOURCES` names every directory of TypeScript this package holds, and it grows with
// the package (run-observation ticket 02 added `observer/`). A directory missing from it is linted
// by NOTHING while CI reports green, which is the same failure `tsconfig.json`'s `include` guards
// against and is just as quiet.
//
// The TypeScript layer is reached through a `files`-scoped `extends` rather than spread at the top
// level, because typescript-eslint's `recommended` carries the TypeScript PARSER with it. Unscoped,
// that parser would also be handed `launch.mjs` — the one file of the server that is deliberately
// plain JavaScript, since it is what checks whether this Node can run TypeScript at all.
//
// This lints SOURCE ONLY. `node_modules` is off the table by ESLint's own default, and nothing else
// in this directory is ours: the `SessionStart` hook stages the server into a user's data directory,
// never back into here.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const TYPESCRIPT_SOURCES = ["server/**/*.ts", "observer/**/*.ts"];

export default tseslint.config(
  js.configs.recommended,
  {
    files: TYPESCRIPT_SOURCES,
    extends: [tseslint.configs.recommended],
  },
  {
    // Everything here runs under Node — the server, its launcher, and this config file. Without
    // these globals `no-undef` (in `js.configs.recommended`) reports `process` and `console` as
    // undefined in `launch.mjs`; the TypeScript layer turns that rule off for `.ts` files, where
    // the compiler already answers the question better.
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.node,
    },
  },
);
