/**
 * MCP server for the Eden docs, deployed as the `_worker.js` of the
 * Cloudflare Pages site (copied into dist/public at deploy time): it serves
 * the MCP endpoint at /api/mcp (plus /mcp for compatibility) and passes every
 * other request through to the static site. Tools mirror vocs's built-in MCP
 * server (list_pages / read_page / search_docs), but read the markdown the
 * vocs build emits as static assets — llms.txt for the page index and
 * /assets/md/<path>.md for page content — instead of the filesystem.
 *
 * Implements the MCP Streamable HTTP transport statelessly: every request is
 * self-contained JSON-RPC over POST, responses are plain JSON (the spec
 * allows JSON instead of SSE), and no session ids are issued.
 */

const SERVER_INFO = { name: 'eden-docs', version: '1.0.0' }
const PROTOCOL_VERSIONS = ['2024-11-05', '2025-03-26', '2025-06-18']

const TOOLS = [
  {
    name: 'list_pages',
    description: 'List all documentation pages with their titles and paths.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'read_page',
    description: 'Read the content of a documentation page by its path.',
    inputSchema: {
      type: 'object',
      properties: {
        pagePath: {
          type: 'string',
          description: 'The page path (e.g., "/why-eden" or "/networks/mainnet")'
        }
      },
      required: ['pagePath']
    }
  },
  {
    name: 'search_docs',
    description: 'Search documentation for a query string.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' }
      },
      required: ['query']
    }
  }
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version'
}

/** Fetch a static docs asset from the site bundled alongside this worker. */
async function fetchDocs(env, path) {
  const response = await env.ASSETS.fetch(new URL(path, 'https://assets.local'))
  return response.ok ? response.text() : null
}

/** Parse llms.txt sitemap lines: `- [Title](/path)` */
async function getPages(env) {
  const text = await fetchDocs(env, '/llms.txt')
  if (!text) throw new Error('Failed to load page index (llms.txt)')
  const pages = []
  for (const match of text.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/gm)) {
    pages.push({ title: match[1], path: match[2] })
  }
  return pages
}

function normalizePagePath(pagePath) {
  let path = String(pagePath || '/')
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\.md$/, '').replace(/\/$/, '') || '/index'
  return path
}

async function readPageMarkdown(env, pagePath) {
  const path = normalizePagePath(pagePath)
  const text =
    (await fetchDocs(env, `/assets/md${path}.md`)) ??
    (await fetchDocs(env, `/assets/md${path}/index.md`))
  // vocs prepends a sitemap HTML comment to every generated markdown file;
  // it's noise for page reads and makes every page match sitemap terms in
  // search.
  return text === null ? null : text.replace(/^<!--[\s\S]*?-->\s*/, '')
}

async function callTool(env, name, args) {
  if (name === 'list_pages') {
    const pages = await getPages(env)
    return { content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }] }
  }

  if (name === 'read_page') {
    const text = await readPageMarkdown(env, args?.pagePath)
    if (text === null) {
      return {
        content: [{ type: 'text', text: `Page not found: ${args?.pagePath}` }],
        isError: true
      }
    }
    return { content: [{ type: 'text', text }] }
  }

  if (name === 'search_docs') {
    const query = String(args?.query ?? '').toLowerCase()
    const pages = await getPages(env)
    const contents = await Promise.all(
      pages.map(async page => ({ page, text: await readPageMarkdown(env, page.path) }))
    )
    const results = []
    for (const { page, text } of contents) {
      if (!text || !text.toLowerCase().includes(query)) continue
      const matchLine = text.split('\n').find(line => line.toLowerCase().includes(query))
      results.push({ path: page.path, snippet: matchLine?.trim().slice(0, 200) || '' })
    }
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
  }

  throw { code: -32602, message: `Unknown tool: ${name}` }
}

async function handleRpc(env, message) {
  const { id, method, params } = message

  // Notifications expect no response.
  if (id === undefined || id === null) return null

  try {
    let result
    if (method === 'initialize') {
      const requested = params?.protocolVersion
      result = {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[1],
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO
      }
    } else if (method === 'ping') {
      result = {}
    } else if (method === 'tools/list') {
      result = { tools: TOOLS }
    } else if (method === 'tools/call') {
      result = await callTool(env, params?.name, params?.arguments)
    } else {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      }
    }
    return { jsonrpc: '2.0', id, result }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: typeof error?.code === 'number' ? error.code : -32603,
        message: error?.message ?? String(error)
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const isMcpPath = url.pathname === '/mcp' || url.pathname === '/api/mcp'

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // Everything except the MCP endpoint is the static site.
    if (!isMcpPath) return env.ASSETS.fetch(request)

    // Stateless server: no SSE stream to resume, no session to terminate.
    if (request.method === 'GET') {
      return new Response('SSE not supported; POST JSON-RPC messages instead', {
        status: 405,
        headers: { ...CORS_HEADERS, Allow: 'POST, DELETE, OPTIONS' }
      })
    }
    if (request.method === 'DELETE') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const messages = Array.isArray(body) ? body : [body]
    const responses = (await Promise.all(messages.map(m => handleRpc(env, m)))).filter(
      r => r !== null
    )

    // Only notifications: acknowledge with no body.
    if (responses.length === 0) {
      return new Response(null, { status: 202, headers: CORS_HEADERS })
    }

    return Response.json(Array.isArray(body) ? responses : responses[0], {
      headers: CORS_HEADERS
    })
  }
}
