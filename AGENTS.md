# Local resource constraints

This project is edited on an 8 GB Mac that has experienced system freezes.

- Do not start development/production servers, previews, or builds unless the
  user explicitly authorizes that execution. A request to edit or fix code is
  not authorization to start a server or run a build.
- Do not bypass `scripts/dev.mjs` with `npx next dev`, direct Next CLI calls,
  or a newly created automatic preview configuration.
- When a server is explicitly requested, use `npm run dev -- --allow-server`.
  It selects Webpack and limits the Node heap. The heap limit is not a total
  process or system memory limit; do not run multiple copies concurrently.
- Prefer static checks, one process at a time, with a bounded Node heap.
  Do not run builds, type checking, and lint simultaneously.
- Exclude node_modules, .next and .git from recursive content searches.
  Never delete caches or dependencies as a first-line performance fix.
