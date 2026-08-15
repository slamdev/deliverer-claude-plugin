// ESLint's flat configuration for the end-to-end harness.
//
// The same two layers the tools server uses — `js.configs.recommended` over everything, and
// `tseslint.configs.recommended` over the TypeScript sources — and a separate file rather than a
// shared one, because `e2e-tests` is its own package and shares nothing with `plugin/mcp`.
//
// The TypeScript layer is `files`-scoped rather than spread at the top level: typescript-eslint's
// `recommended` carries the TypeScript PARSER with it, and this config file is itself plain
// JavaScript.
//
// This lints SOURCE ONLY. `node_modules` is off the table by ESLint's own default, and nothing a
// run leaves behind is written back here — it all lands in the run directory, outside the
// repository entirely.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  {
    files: ["harness/**/*.ts", "tests/**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
  {
    // Everything here runs under Node — the harness, the tests, and this config file.
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.node,
    },
  },
);
