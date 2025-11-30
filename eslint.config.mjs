import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import effectPlugin from "@effect/eslint-plugin";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@effect": effectPlugin,
      "import": importPlugin,
    },
    rules: {
      // Effect-specific rules
      "@effect/dprint": "off", // Handled by prettier
      "@effect/no-import-from-barrel-package": "error", // Prevent circular imports
      
      // Import rules to catch circular dependencies
      "import/no-cycle": ["error", { maxDepth: 10, ignoreExternal: true }],
      "import/no-self-import": "error",
      
      // Catch top-level await (including await import)
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportNamedDeclaration > AwaitExpression",
          message: "Top-level await in exports can cause initialization issues. Use Layer.suspend or lazy evaluation."
        }
      ],
      
      // TypeScript consistency
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      
      // Catch common mistakes
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  // Domain package overrides (Effect patterns)
  {
    files: ["packages/domain/**/*.ts"],
    rules: {
      "@typescript-eslint/no-this-alias": "off", // Effect .pipe patterns use this
    },
  },
  // Infrastructure package overrides (adapter type conversions)
  {
    files: ["packages/infrastructure/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Prisma/adapter type conversions
      "@typescript-eslint/no-this-alias": "off", // Class-based adapters use this pattern
    },
  },
  // API package overrides (tRPC type conversions)
  {
    files: ["packages/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // tRPC/Effect type conversions
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "packages/*/dist/**",
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__tests__/**",
  ]),
]);

export default eslintConfig;
