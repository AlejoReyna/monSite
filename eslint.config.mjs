import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    // Root-level diagnostics are ad-hoc reproduction scripts, not shipped
    // application code. Keep production lint focused on the Next.js surface.
    ignores: ["test-*.js"],
  },
  ...nextVitals,
  ...nextTypeScript,
];

export default eslintConfig;
