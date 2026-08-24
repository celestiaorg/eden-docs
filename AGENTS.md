# Eden Docs Agent Guide

## Scope

- This repository contains the public developer documentation for Eden.
- Production is served at `https://docs.eden.zone`.
- Make focused changes. Do not change product facts, network values, or deployment behavior without a source.
- Preserve unrelated worktree changes.

## Stack and layout

- Use Bun 1.2 or later for dependencies and scripts.
- Vocs builds the documentation site from `docs/`.
- Markdown and MDX pages live in `docs/pages/`.
- Reusable documentation components live in `docs/components/`.
- Navigation and site metadata live in `vocs.config.ts`.
- Static assets live in `public/`.
- `worker/index.js` serves the MCP endpoint from the Cloudflare Pages artifact.
- GitHub Actions workflows live in `.github/workflows/`.
- Agent skills live in `.agents/skills/<skill-name>/SKILL.md`.

## Setup and commands

```bash
bun install
bun dev
bun run build
bun run fmt:check
bun run typecheck
bun run links
```

- Use `bun install --frozen-lockfile` when you only need the committed dependency set.
- Use `bun run fmt` only when you intend to format the changed files.
- `bun run build` must produce the full Cloudflare Pages artifact in `dist/public/`.
- Run the smallest relevant checks during development. Run `bun run fmt:check`, `bun run typecheck`, and `bun run build` before handoff.
- Run `bun run links` when you add or change links. Some remote sites can rate-limit link checks; report external failures accurately.

## Documentation conventions

- Use clear, direct language for application developers.
- Keep existing heading depth and Vocs MDX syntax.
- Use repository-relative links for internal documentation pages.
- Use descriptive link text for external resources.
- Put canonical network values in the relevant page under `docs/pages/networks/` or `docs/pages/tokens/`.
- Do not duplicate reference data across broad tutorial pages unless the tutorial needs it.
- Add a new page to the `sidebar` in `vocs.config.ts` when readers must navigate to it.
- Keep `docs/pages.gen.ts` synchronized with the pages tree. Start `bun dev` to regenerate it after adding, moving, or removing pages.
- Do not edit generated build output in `dist/`.

## Deployment constraints

- Cloudflare Pages is the only deployment target.
- The production branch is `main`.
- `bun run build` must emit the static site, root-level Markdown assets, and `dist/public/_worker.js`.
- The public MCP endpoint is `https://docs.eden.zone/api/mcp`.
- Do not configure or document a separate Worker for MCP.
- Pull requests from same-repository branches can receive a Pages preview at `<branch>.eden-docs-6l7.pages.dev`.

## Change workflow

1. Inspect the current page, nearby pages, and navigation before editing.
2. Confirm time-sensitive product and network facts from an authoritative source.
3. Make the narrowest change that satisfies the request.
4. Review the diff for accidental generated files, formatting churn, and unrelated edits.
5. Run the relevant checks and report any check you could not run.

## Agent instruction layout

- Keep all repository-wide agent instructions in this file.
- Keep this file below 300 lines.
- `CLAUDE.md` must remain a symlink to `AGENTS.md`.
- `.claude/skills` and `.cursor/skills` must remain symlinks to `../.agents/skills`.
- Do not replace these symlinks with copied files or directories.
- Do not make the full `.claude` directory a symlink.
- Each skill directory must contain a `SKILL.md` with `name` and `description` frontmatter fields.
