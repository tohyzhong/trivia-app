import * as espree from "espree";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import unusedImportsPlugin from "eslint-plugin-unused-imports";

export default [
  // JS files
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      parser: espree,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: { js: {} },
    rules: {}
  },

  // JSX files
  {
    files: ["**/*.jsx"],
    languageOptions: {
      parser: espree,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: { react: reactPlugin },
    rules: {
      ...reactPlugin.configs.recommended.rules
    }
  },

  // TS and TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./frontend/tsconfig.json"
      }
    },
    plugins: { "@typescript-eslint": tsPlugin, react: reactPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules
    }
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "unused-imports": unusedImportsPlugin },
    rules: {
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_"
        }
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  }
];
