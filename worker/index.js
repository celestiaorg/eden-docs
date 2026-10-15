/**
 * MCP server for the Eden docs, deployed as the `_worker.js` of the
 * Cloudflare Pages site (copied into dist/public at deploy time): it serves
 * the MCP endpoint at /api/mcp and negotiates Markdown for static docs pages.
 * Tools mirror vocs's built-in MCP server (list_pages / read_page
 * / search_docs), but read the markdown the vocs build emits as static assets
 * — llms.txt for the page index and /assets/md/<path>.md for page content —
 * instead of the filesystem.
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
          pattern: '\\S',
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
        query: { type: 'string', pattern: '\\S', description: 'The search query' }
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

function prefersMarkdown(accept = '') {
  const types = new Map(
    accept.split(',').map(entry => {
      const [type, ...parameters] = entry.trim().toLowerCase().split(';')
      const quality = parameters.find(value => value.trim().startsWith('q='))
      return [type.trim(), quality ? Number(quality.trim().slice(2)) : 1]
    })
  )
  const markdown = types.get('text/markdown') ?? 0
  const html = types.get('text/html') ?? types.get('text/*') ?? types.get('*/*') ?? 0
  return markdown > 0 && markdown >= html
}

async function serveDocs(request, env) {
  const response = await env.ASSETS.fetch(request)
  if (!['GET', 'HEAD'].includes(request.method)) return response
  const url = new URL(request.url)
  if (url.pathname === '/openapi.json' || url.pathname.startsWith('/.well-known/agent-skills/')) {
    const headers = new Headers(response.headers)
    headers.set('Access-Control-Allow-Origin', '*')
    if (response.ok) {
      headers.set(
        'Content-Type',
        url.pathname.endsWith('.md') ? 'text/markdown; charset=utf-8' : 'application/json'
      )
    }
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      headers
    })
  }
  if (!response.headers.get('Content-Type')?.includes('text/html')) return response

  let result = response
  if (prefersMarkdown(request.headers.get('Accept') ?? '')) {
    if (response.status === 404) {
      result = new Response(
        '# Page not found\n\nThis documentation page does not exist. Browse the [page index](/llms.txt) or [documentation home](/).\n',
        { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
      )
    } else if (response.ok) {
      const path = url.pathname.replace(/\/$/, '') || '/index'
      const markdown = await env.ASSETS.fetch(new URL(`/assets/md${path}.md`, url), {
        method: request.method
      })
      if (markdown.ok && !markdown.headers.get('Content-Type')?.includes('text/html')) {
        result = new Response(markdown.body, markdown)
        result.headers.set('Content-Type', 'text/markdown; charset=utf-8')
      }
    }
  }

  const headers = new Headers(result.headers)
  const vary = headers.get('Vary')
  if (!vary?.split(',').some(value => value.trim().toLowerCase() === 'accept')) {
    headers.set('Vary', vary ? `${vary}, Accept` : 'Accept')
  }
  headers.append(
    'Link',
    '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml", </api/mcp/server-card>; rel="service-desc"; type="application/mcp-server-card+json", </openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json", </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"'
  )
  return new Response(request.method === 'HEAD' ? null : result.body, {
    status: result.status,
    statusText: result.statusText,
    headers
  })
}

/** Fetch a static docs asset from the site bundled alongside this worker. */
async function fetchDocs(env, path) {
  const response = await env.ASSETS.fetch(new URL(path, 'https://assets.local'))
  return response.ok && !response.headers.get('Content-Type')?.includes('text/html')
    ? response.text()
    : null
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
  const tool = TOOLS.find(tool => tool.name === name)
  if (!tool) throw { code: -32602, message: `Unknown tool: ${name ?? '(missing name)'}` }
  if (args !== undefined && !isObject(args)) {
    throw { code: -32602, message: 'Tool arguments must be an object' }
  }
  for (const key of tool.inputSchema.required ?? []) {
    if (typeof args?.[key] !== 'string' || !args[key].trim()) {
      throw { code: -32602, message: `${name} requires a non-empty string: ${key}` }
    }
  }

  if (name === 'list_pages') {
    const pages = await getPages(env)
    return { content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }] }
  }

  if (name === 'read_page') {
    // Only read indexed pages; user input must never select arbitrary assets.
    const pages = await getPages(env)
    const page = pages.find(
      page => normalizePagePath(page.path) === normalizePagePath(args.pagePath)
    )
    const text = page ? await readPageMarkdown(env, page.path) : null
    if (text === null) {
      return {
        content: [{ type: 'text', text: `Page not found: ${args?.pagePath}` }],
        isError: true
      }
    }
    return { content: [{ type: 'text', text }] }
  }

  if (name === 'search_docs') {
    const query = args.query.toLowerCase()
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
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

async function handleRpc(env, message) {
  if (
    !isObject(message) ||
    message.jsonrpc !== '2.0' ||
    typeof message.method !== 'string' ||
    (message.params !== undefined && !isObject(message.params)) ||
    (message.id !== undefined && typeof message.id !== 'string' && !Number.isInteger(message.id))
  ) {
    return rpcError(null, -32600, 'Invalid Request')
  }
  const { id, method, params } = message

  // Notifications expect no response.
  if (id === undefined) return null

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
      return rpcError(id, -32601, `Method not found: ${method}`)
    }
    return { jsonrpc: '2.0', id, result }
  } catch (error) {
    return rpcError(
      id,
      error?.code === -32602 ? -32602 : -32603,
      error?.code === -32602 ? error.message : 'Unable to read documentation. Please retry.'
    )
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const isMcpPath = url.pathname === '/api/mcp'

    if (
      ['GET', 'HEAD'].includes(request.method) &&
      ['/.well-known/api-catalog', '/.well-known/ai-catalog.json'].includes(url.pathname)
    ) {
      const isApiCatalog = url.pathname === '/.well-known/api-catalog'
      const catalog = isApiCatalog
        ? {
            linkset: [
              {
                anchor: new URL('/api/mcp', url).href,
                'service-desc': [
                  {
                    href: new URL('/openapi.json', url).href,
                    type: 'application/vnd.oai.openapi+json'
                  }
                ],
                'service-doc': [
                  { href: new URL('/use-the-docs-with-ai', url).href, type: 'text/html' }
                ]
              }
            ]
          }
        : {
            specVersion: '1.0',
            host: {
              displayName: 'Eden docs',
              identifier: 'did:web:docs.eden.zone'
            },
            entries: [
              {
                identifier: 'urn:air:docs.eden.zone:mcp:docs',
                displayName: 'Eden documentation MCP server',
                type: 'application/mcp-server-card+json',
                url: new URL('/api/mcp/server-card', url).href,
                representativeQueries: [
                  'Search Eden documentation',
                  'Read an Eden documentation page'
                ]
              },
              {
                identifier: 'urn:air:docs.eden.zone:skills:index',
                displayName: 'Eden development skill',
                type: 'application/json',
                url: new URL('/.well-known/agent-skills/index.json', url).href,
                representativeQueries: ['Deploy a contract on Eden', 'Build an Eden frontend']
              },
              {
                identifier: 'urn:air:docs.eden.zone:docs:llms-txt',
                displayName: 'Eden documentation index',
                type: 'text/plain',
                url: new URL('/llms.txt', url).href,
                representativeQueries: [
                  'Find Eden network settings',
                  'Browse Eden developer guides'
                ]
              }
            ]
          }
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(catalog), {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=300',
          'Content-Type': isApiCatalog ? 'application/linkset+json' : 'application/json'
        }
      })
    }

    if (
      ['GET', 'HEAD'].includes(request.method) &&
      ['/api/mcp/server-card', '/.well-known/mcp/server-card.json'].includes(url.pathname)
    ) {
      return new Response(
        request.method === 'HEAD'
          ? null
          : JSON.stringify({
              name: 'io.github.celestiaorg/eden-docs',
              title: 'Eden docs',
              description: 'Public, read-only search and Markdown access to Eden documentation.',
              version: SERVER_INFO.version,
              websiteUrl: new URL('/use-the-docs-with-ai', url).href,
              remotes: [
                {
                  type: 'streamable-http',
                  url: new URL('/api/mcp', url).href,
                  supportedProtocolVersions: PROTOCOL_VERSIONS
                }
              ]
            }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/mcp-server-card+json',
            'Cache-Control': 'public, max-age=300'
          }
        }
      )
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // Serve the static site with Markdown negotiation and discovery headers.
    if (!isMcpPath) return serveDocs(request, env)

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

    const protocolVersion = request.headers.get('MCP-Protocol-Version') ?? '2025-03-26'
    if (!PROTOCOL_VERSIONS.includes(protocolVersion)) {
      return Response.json(rpcError(null, -32600, 'Unsupported MCP-Protocol-Version'), {
        status: 400,
        headers: CORS_HEADERS
      })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return Response.json(rpcError(null, -32700, 'Parse error'), {
        status: 400,
        headers: CORS_HEADERS
      })
    }

    if (Array.isArray(body) && (body.length === 0 || protocolVersion === '2025-06-18')) {
      return Response.json(rpcError(null, -32600, 'Invalid Request'), {
        status: 400,
        headers: CORS_HEADERS
      })
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
      status: !Array.isArray(body) && responses[0].error?.code === -32600 ? 400 : 200,
      headers: CORS_HEADERS
    })
  }
}
