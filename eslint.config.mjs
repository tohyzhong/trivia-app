import * as espree from "espree";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import jsonPlugin from "eslint-plugin-json";
import markdownPlugin from "eslint-plugin-markdown";
import cssPlugin from "eslint-plugin-css";
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
    plugins: { js: {} }, // @eslint/js exports default config objects, you may omit or import js if needed
    rules: {
      // Add js recommended rules here if you want, or leave empty
    }
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

  // // JSON files
  // {
  //   files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
  //   plugins: { json: jsonPlugin },
  //   rules: {
  //     ...jsonPlugin.configs.recommended.rules
  //   }
  // },

  // // Markdown files
  // {
  //   files: ["**/*.md"],
  //   plugins: { markdown: markdownPlugin },
  //   rules: {
  //     ...markdownPlugin.configs.recommended.rules
  //   }
  // },

  // CSS files
  // {
  //   files: ["**/*.css"],
  //   plugins: { css: cssPlugin },
  //   rules: {
  //     ...cssPlugin.configs.recommended.rules
  //   }
  // },

  // Unused imports + no-console warnings for JS/TS/JSX/TSX
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
