import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.turbo/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
