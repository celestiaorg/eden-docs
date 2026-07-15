# eden-docs

This project uses [bun](https://bun.sh) (>= 1.2) as its package manager and task runner. Older bun versions can't read the text-based `bun.lock` lockfile and will do a slow, unpinned full resolve — upgrade with `bun upgrade`.

to install dependencies:

```bash
bun install
```

to start the development server:

```bash
bun dev
```

to preview a built site locally:

```bash
bun run preview
```

to build the Cloudflare Pages artifact (output in `dist/public/`):

```bash
bun run build
```

## Deployment

Production is served by Cloudflare Pages at `https://docs.eden.zone`.

The GitHub Actions workflow in `.github/workflows/deploy-cloudflare.yml` is the
normal deploy path. Pushes to `main` build and deploy the Pages project using
the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

`bun run build` must produce the full Pages artifact:

- the static Vocs site in `dist/public/`
- root-level Markdown files copied from `dist/public/assets/md/`
- `dist/public/_worker.js`, copied from `worker/index.js`

The Pages worker serves the public MCP endpoint at:

```text
https://docs.eden.zone/api/mcp
```

Do not configure or document a separate Worker for MCP. The MCP endpoint is
bundled into the Pages deployment as `_worker.js`.

## Deploy previews

Conductor exposes a shared `Deploy preview` run option through
`.conductor/settings.toml`. It runs `scripts/deploy-preview.sh`, which:

- refuses detached HEAD, `main`, and dirty workspaces
- pushes the current branch to `origin`
- dispatches `.github/workflows/deploy-cloudflare.yml` from `main`
- waits for the GitHub Actions run and prints the Cloudflare Pages preview URL

You can run the same flow from a terminal:

```bash
bash scripts/deploy-preview.sh
```

The preview deploy path uses GitHub Actions and the repository Cloudflare
secrets. It is separate from `bun run preview`, which only serves a local built
site, and from `bun run deploy`, which is production-capable and should not be
used for branch previews.
