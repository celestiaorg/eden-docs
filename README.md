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

Cloudflare DNS records and registrar DNSSEC settings are managed separately from
the Cloudflare Pages deployment. For discovery of the scanned `docs.eden.zone`
hostname, publish this ServiceMode SVCB index record in the `eden.zone` zone:

```dns
_index._agents.docs.eden.zone. 3600 IN SVCB 1 docs.eden.zone. alpn="h2" port=443
```

In Cloudflare, choose type `SVCB`, name `_index._agents.docs`, priority `1`,
target `docs.eden.zone`, parameters `alpn="h2" port=443`, TTL `3600`, and
DNS-only. Confirm that the target supports HTTP/2 before publishing. Existing
live `_mcp` records need not be removed.

The target hostname and `port` are the endpoint connection parameters. Advertise
the transport the host actually negotiates (`h2`), not an application protocol
such as `mcp` or `a2a` that its TLS endpoint does not negotiate. If experimenting
with draft-specific SVCB parameters, use numeric `keyNNNNN` names agreed with the
consumer until registered; the record above needs no custom parameters.

This follows the experimental
[DNS-AID draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
using standard [SVCB transport parameters](https://www.rfc-editor.org/rfc/rfc9460).
The target already serves the [AI catalog](https://docs.eden.zone/.well-known/ai-catalog.json),
which links the MCP server card at `https://docs.eden.zone/api/mcp/server-card`
(also served at `/.well-known/mcp/server-card.json`) and the `/api/mcp` endpoint. The catalog path is a deployment convention: standard SVCB transport
parameters do not encode a URL path. Clients must know that convention; the DNS
record alone does not provide automatic end-to-end discovery.

For authenticated DNS answers, [enable DNSSEC signing in Cloudflare](https://developers.cloudflare.com/dns/dnssec/),
then publish the exact provider-generated DS record at the domain registrar if
the registrar does not handle it automatically. Verify the complete chain of
trust; zone signing alone is insufficient. Do not disable signing while its DS
record remains in the parent zone.

After publication, check both validating resolvers and the deployed catalog:

```bash
dig @1.1.1.1 _index._agents.docs.eden.zone TYPE64 +dnssec
dig @8.8.8.8 _index._agents.docs.eden.zone TYPE64 +dnssec
dig @1.1.1.1 eden.zone DS +dnssec
dig @8.8.8.8 eden.zone DS +dnssec
curl -fsS https://docs.eden.zone/.well-known/ai-catalog.json
curl -fsS https://docs.eden.zone/.well-known/mcp/server-card.json
```

`TYPE64` is SVCB's numeric type and also works with older macOS `dig` versions.
Require the intended SVCB and DS records and authenticated validation (`ad` in
the DNS response flags). Allow positive and negative DNS caches to expire before
rechecking. Then rerun the agent-readiness scan. Committing these instructions
does not publish DNS records or enable DNSSEC.

## Authentication discovery checks

[OAuth/OIDC authorization server metadata](https://www.rfc-editor.org/rfc/rfc8414),
[OAuth protected resource metadata](https://www.rfc-editor.org/rfc/rfc9728), and
[auth.md registration metadata](https://github.com/workos/auth.md) are unnecessary
for this public documentation service. Add them only if actual protected
resources, issuers, or registration flows exist; missing scanner checks are not
grounds to invent those services.
