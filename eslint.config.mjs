import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

// Flat config nativo (sin FlatCompat: su validación de eslintrc choca con la
// estructura circular del plugin de React en ESLint 9/10). El chequeo de tipos
// lo cubre `next build` / `npm run typecheck`.
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".claude/**",
      "node_modules/**",
      "design_handoff_flowpub/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];

export default eslintConfig;
