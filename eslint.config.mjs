import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-undef": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
