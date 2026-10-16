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

## DNS-based agent discovery

DNS records are managed separately from the Pages deployment. In the `eden.zone`
zone, publish this ServiceMode SVCB record for the public documentation MCP server:

```dns
_mcp._agents.docs.eden.zone. 3600 IN SVCB 1 docs.eden.zone. alpn="mcp,h2,h3" port=443
```

In Cloudflare, choose type `SVCB`, name `_mcp._agents.docs`, priority `1`, target
`docs.eden.zone`, and value `alpn="mcp,h2,h3" port=443`. Keep the record DNS-only.
The target serves the MCP server card at
`https://docs.eden.zone/.well-known/mcp/server-card.json`; the card identifies the
Streamable HTTP endpoint at `/api/mcp`. Do not advertise an A2A service.

This follows the experimental
[DNS-AID draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
using standard [SVCB parameters](https://www.rfc-editor.org/rfc/rfc9460).
DNS-AID's use of `mcp` in ALPN is experimental; review the draft before changing
these records. No unregistered custom SvcParamKeys are required for this record.

For authenticated discovery, enable DNSSEC for `eden.zone` in Cloudflare and
publish the exact DS record Cloudflare provides at the domain registrar. Follow
[Cloudflare's DNSSEC setup](https://developers.cloudflare.com/dns/dnssec/).
Enabling zone signing alone does not establish the parent chain of trust.

Verify publication and DNSSEC through a validating resolver:

```bash
dig @1.1.1.1 _mcp._agents.docs.eden.zone SVCB +dnssec
dig @1.1.1.1 eden.zone DS +dnssec
```

The SVCB answer should contain the record above and the response flags should
include `ad`. Then rerun the agent-readiness scan. Committing this guide does not
publish DNS records or enable DNSSEC.
