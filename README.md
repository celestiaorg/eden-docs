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

to build the static site (output in `out/`):

```bash
bun run build
```
