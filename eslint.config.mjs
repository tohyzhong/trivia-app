import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    extends: ["js/recommended"]
  },

  {
    files: ["**/*.jsx"],
    plugins: { js, react: pluginReact },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    extends: ["js/recommended", pluginReact.configs.flat.recommended]
  },

  {
    files: ["**/*.{ts,mts,cts}"],
    ...tseslint.configs.recommended
  },

  {
    files: ["**/*.tsx"],
    ...tseslint.configs.recommended,
    extends: [
      ...tseslint.configs.recommended.extends,
      pluginReact.configs.flat.recommended
    ]
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"]
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"]
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"]
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"]
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"]
  }
]);
