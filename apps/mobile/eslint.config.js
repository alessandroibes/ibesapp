const tseslint = require("typescript-eslint");
module.exports = tseslint.config(
  { ignores: ["node_modules", ".expo", "dist", "expo-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    files: ["*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
