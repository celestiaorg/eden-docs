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
