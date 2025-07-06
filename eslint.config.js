import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import jest from "eslint-plugin-jest";
import lodash from "eslint-plugin-lodash";

const inCi = !!import.meta.env?.CI_PIPELINE_ID;
const expensive = inCi || !!import.meta.env?.ESLINT_STRICT;
const errLevel = expensive ? "error" : "warn";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      project: expensive ? "./tsconfig-validate.json" : undefined,
      tsconfigRootDir: expensive ? "." : undefined,
    },
  },
  plugins: {
    "@typescript-eslint": tseslint.plugin,
    jest: jest,
    lodash: lodash,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-return-await": "off", // Disable this rule so that "@typescript-eslint/return-await" works correctly.
    "@typescript-eslint/no-unsafe-declaration-merging": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-unsafe-function-type": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    ...(expensive
      ? {
          "@typescript-eslint/no-floating-promises": errLevel,
          "@typescript-eslint/return-await": errLevel,
        }
      : {}),
    "no-console": [
      errLevel,
      { allow: ["time", "timeEnd", "trace", "warn", "error", "info", "groupEnd", "group", "groupCollapsed"] },
    ],
    "no-debugger": 2,
    "jest/no-focused-tests": errLevel,
    "lodash/import-scope": [errLevel, "member"],
  },
  ignores: ["node_modules", "dist", "build", "*.min.js"],
});
