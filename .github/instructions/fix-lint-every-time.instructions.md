---
description: "Use when editing JavaScript or TypeScript in TechBubble. Enforces: fix lint every time, rerun lint before finishing, and do not leave unresolved lint errors in changed scope. Trigger on: lint error, eslint, next lint, clean up warnings, fix lint everytime."
name: "Fix Lint Every Time"
applyTo: "**/*.{js,jsx,ts,tsx,mjs,cjs}"
---

# Fix Lint Every Time

- Treat lint as part of done: after any code edit, run lint for the affected package before finishing.
- Choose the smallest scope first:
  - `apps/web/**`: run `pnpm --filter @techbubble/web lint`
  - `apps/admin/**`: run `pnpm --filter @techbubble/admin lint`
  - `packages/api/**`: run `pnpm --filter @techbubble/api lint`
  - mixed or unclear scope: run `pnpm lint`
- If lint fails, run an auto-fix pass immediately:
  - `pnpm --filter @techbubble/web lint -- --fix`
  - `pnpm --filter @techbubble/admin lint -- --fix`
  - `pnpm --filter @techbubble/api lint -- --fix`
- After auto-fix, rerun lint for the same scope and confirm it is clean.
- If warnings/errors remain that cannot be auto-fixed, fix them manually before completion.
- If a lint issue is outside touched files or appears unrelated, call it out explicitly and ask before broad refactors.
- Do not claim completion while lint still fails in the relevant scope.
