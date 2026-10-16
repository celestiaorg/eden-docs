# Eden documentation for agents

## When to use these docs

Use these docs to configure an Eden network connection, deploy Solidity contracts,
build frontends with viem or wagmi, understand sponsored and batch transactions,
or run an Eden full node.

- Browse the [developer portal](/developers) for quickstarts, CLI tools, and testnet access.
- Start with the page index at `/llms.txt` or complete documentation at `/llms-full.txt`.
- Request any documentation page with `Accept: text/markdown`, or append `.md`
  to its path. The homepage Markdown is `/index.md`.
- Read canonical network settings in [mainnet](/networks/mainnet) or
  [testnet](/networks/testnet); do not substitute Celestia's network settings.
- Connect to the public, read-only MCP server at `/api/mcp` using Streamable HTTP.
  Use `list_pages`, `read_page`, or `search_docs`; see the
  [setup guide](/use-the-docs-with-ai) for client configuration.
- Discover the MCP connection details at `/api/mcp/server-card`.
- In a WebMCP-capable browser, use `search_eden_docs` with a non-empty `query`
  to get matching documentation paths and snippets without authentication.
- Discover the Eden development skill at `/.well-known/agent-skills/index.json`.
  Verify the skill's SHA-256 digest before loading its instructions.
- Use `/api/v1/pages`, `/api/v1/page?path=/networks/mainnet`, or
  `/api/v1/search?query=sponsored` for typed JSON access without an MCP client.
  See the [REST reference](/api-reference) for parameters and error recovery.
- Read the REST and MCP request and error schemas at `/openapi.json`; find discovery
  links in `/.well-known/api-catalog` and `/.well-known/ai-catalog.json`.

The documentation and MCP server require no authentication. Never send wallet
recovery phrases, private keys, API keys, or `.env` files to this site.
