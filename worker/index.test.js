import { expect, test } from 'bun:test'
import worker from './index.js'
import openapi from '../public/openapi.json'

const env = {
  ASSETS: {
    async fetch(input) {
      const path = new URL(input.url ?? input).pathname
      if (path === '/openapi.json') return Response.json(openapi)
      if (path === '/llms.txt') {
        return new Response('- [Home](/)\n- [Mainnet](/networks/mainnet)')
      }
      if (path === '/assets/md/index.md' || path === '/assets/md/networks/mainnet.md') {
        return new Response('# Eden documentation', {
          headers: { 'Content-Type': 'text/plain', ETag: 'markdown' }
        })
      }
      if (path === '/favicon.svg') {
        return new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } })
      }
      const found = ['/', '/networks/mainnet', '/networks/mainnet/'].includes(path)
      return new Response('<html>Eden documentation</html>', {
        status: found ? 200 : 404,
        headers: {
          'Content-Type': 'text/html',
          Vary: 'Accept-Encoding',
          Link: '</style.css>; rel="preload"',
          ETag: 'html'
        }
      })
    }
  }
}

function request(path, accept = 'text/markdown', method = 'GET') {
  return worker.fetch(
    new Request(`https://preview.example${path}`, { method, headers: { Accept: accept } }),
    env
  )
}

test('homepage and nested pages negotiate Markdown with cache and discovery headers', async () => {
  for (const path of ['/', '/networks/mainnet', '/networks/mainnet/']) {
    const response = await request(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/markdown')
    expect(response.headers.get('Vary')).toContain('Accept')
    expect(response.headers.get('ETag')).toBe('markdown')
    expect(response.headers.get('Link')).toContain('/llms.txt')
    expect(await response.text()).toBe('# Eden documentation')
  }
})

function rpc(body, headers = {}, bindings = env) {
  return worker.fetch(
    new Request('https://preview.example/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    }),
    bindings
  )
}

test('malformed MCP envelopes return recoverable errors instead of crashing or succeeding', async () => {
  for (const body of [
    null,
    42,
    'ping',
    {},
    [],
    { jsonrpc: '1.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', id: 1 },
    { jsonrpc: '2.0', id: null, method: 'ping' },
    { jsonrpc: '2.0', id: true, method: 'ping' },
    { jsonrpc: '2.0', id: 1.5, method: 'ping' },
    { jsonrpc: '2.0', method: 'ping', params: [] }
  ]) {
    const response = await rpc(body)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe(-32600)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  }
})

test('notifications remain bodyless and valid request IDs are preserved', async () => {
  const notification = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' })
  expect(notification.status).toBe(202)
  expect(await notification.text()).toBe('')
  for (const id of [0, 'request-1']) {
    const response = await rpc({ jsonrpc: '2.0', id, method: 'ping' })
    expect(await response.json()).toEqual({ jsonrpc: '2.0', id, result: {} })
  }
})

test('legacy batches validate each member and modern MCP rejects batching', async () => {
  const batch = [
    null,
    { jsonrpc: '2.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', method: 'notifications/initialized' }
  ]
  const response = await rpc(batch)
  expect(await response.json()).toEqual([
    { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
    { jsonrpc: '2.0', id: 1, result: {} }
  ])
  expect((await rpc(batch, { 'MCP-Protocol-Version': '2025-06-18' })).status).toBe(400)
  expect(
    (
      await rpc(
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        {
          'MCP-Protocol-Version': 'unsupported'
        }
      )
    ).status
  ).toBe(400)
})

test('invalid tool inputs fail before fetching any documentation', async () => {
  for (const params of [
    undefined,
    {},
    { name: 'missing' },
    { name: 'list_pages', arguments: [] },
    { name: 'read_page' },
    { name: 'read_page', arguments: { pagePath: 42 } },
    { name: 'read_page', arguments: { pagePath: '' } },
    { name: 'search_docs' },
    { name: 'search_docs', arguments: { query: '  ' } },
    { name: 'search_docs', arguments: { query: {} } }
  ]) {
    const response = await rpc(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params },
      {},
      {
        ASSETS: {
          fetch() {
            throw new Error('Must not fetch')
          }
        }
      }
    )
    expect((await response.json()).error.code).toBe(-32602)
  }
})

test('tools still list, read and search pages; missing paths stay tool errors', async () => {
  for (const [name, args] of [
    ['list_pages', {}],
    ['read_page', { pagePath: 'networks/mainnet.md' }],
    ['search_docs', { query: 'EDEN' }]
  ]) {
    const response = await rpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args }
    })
    const { result } = await response.json()
    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toBeTruthy()
  }
  for (const pagePath of ['/missing', '/../../AGENTS', '/networks/mainnet?query=1']) {
    const response = await rpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'read_page', arguments: { pagePath } }
    })
    expect((await response.json()).result.isError).toBe(true)
  }
})

test('HTML preferences and q=0 preserve HTML, existing headers, and discovery links', async () => {
  for (const accept of [
    'text/html',
    '*/*',
    '',
    'text/markdown;q=0',
    'text/html;q=1, text/markdown;q=0.5'
  ]) {
    const response = await request('/', accept)
    expect(response.headers.get('Content-Type')).toContain('text/html')
    expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept')
    expect(response.headers.get('Link')).toContain('preload')
    expect(response.headers.get('Link')).toContain('service-desc')
  }
})

test('Markdown preference handles parameters and case', async () => {
  const response = await request('/', 'text/html;q=0.2, Text/Markdown; charset=utf-8; q=0.8')
  expect(response.headers.get('Content-Type')).toContain('text/markdown')
})

test('missing pages retain 404 with recovery links in the requested format', async () => {
  const markdown = await request('/missing')
  expect(markdown.status).toBe(404)
  expect(markdown.headers.get('Content-Type')).toContain('text/markdown')
  expect(await markdown.text()).toContain('[page index](/llms.txt)')
  const html = await request('/missing', 'text/html')
  expect(html.status).toBe(404)
  expect(html.headers.get('Content-Type')).toContain('text/html')
})

test('HEAD has no body and non-document assets keep their representation', async () => {
  const head = await request('/', 'text/markdown', 'HEAD')
  expect(head.headers.get('Content-Type')).toContain('text/markdown')
  expect(await head.text()).toBe('')
  const image = await request('/favicon.svg')
  expect(image.headers.get('Content-Type')).toBe('image/svg+xml')
})

test('server cards advertise the current origin and match live MCP negotiation', async () => {
  const initialized = await worker.fetch(
    new Request('https://preview.example/api/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18' }
      })
    }),
    env
  )
  const { result } = await initialized.json()
  for (const path of ['/api/mcp/server-card', '/.well-known/mcp/server-card.json']) {
    const response = await request(path)
    const card = await response.json()
    expect(card.version).toBe(result.serverInfo.version)
    expect(card.remotes[0].url).toBe('https://preview.example/api/mcp')
    expect(card.remotes[0].supportedProtocolVersions).toContain(result.protocolVersion)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  }
})

test('catalogs advertise reachable discovery routes on the current host', async () => {
  const apiResponse = await request('/.well-known/api-catalog')
  expect(apiResponse.headers.get('Content-Type')).toBe('application/linkset+json')
  const { linkset } = await apiResponse.json()
  expect(linkset[0].anchor).toBe('https://preview.example/api/mcp')
  expect(linkset[0]['service-desc'][0].href).toBe('https://preview.example/openapi.json')
  expect(linkset[0]['service-doc'][0].href).toBe('https://preview.example/use-the-docs-with-ai')

  const aiResponse = await request('/.well-known/ai-catalog.json')
  expect(aiResponse.headers.get('Content-Type')).toBe('application/json')
  const catalog = await aiResponse.json()
  expect(catalog.specVersion).toBe('1.0')
  expect(catalog.host).toEqual({ displayName: 'Eden docs', identifier: 'did:web:docs.eden.zone' })
  expect(catalog.entries).toHaveLength(3)
  for (const entry of catalog.entries) {
    expect(new URL(entry.url).origin).toBe('https://preview.example')
    expect(entry.data).toBeUndefined()
    expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2)
  }
  for (const path of [
    '/.well-known/api-catalog',
    '/.well-known/ai-catalog.json',
    '/openapi.json'
  ]) {
    const head = await request(path, '*/*', 'HEAD')
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect(head.headers.get('Access-Control-Allow-Origin')).toBe('*')
  }
  const home = await request('/')
  expect(home.headers.get('Link')).toContain('rel="api-catalog"')
  expect(home.headers.get('Link')).toContain('rel="ai-catalog"')
  expect(home.headers.get('Link')).toContain('/openapi.json')
})

test('OpenAPI tool schemas match MCP and documented examples execute', async () => {
  const listed = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  const { result } = await listed.json()
  const variants = openapi.components.schemas.ToolCallParams.oneOf
  expect(variants).toHaveLength(result.tools.length)
  for (const tool of result.tools) {
    const variant = variants.find(variant => variant.properties.name.const === tool.name)
    expect(variant.properties.arguments).toEqual(tool.inputSchema)
  }
  const operation = openapi.paths['/api/mcp'].post
  for (const { value } of Object.values(
    operation.requestBody.content['application/json'].examples
  )) {
    const response = await rpc(value)
    expect(response.status).toBe(200)
    expect((await response.json()).error).toBeUndefined()
  }
  const served = await request('/openapi.json', 'application/json')
  expect(served.headers.get('Content-Type')).toBe('application/json')
  expect(await served.json()).toEqual(openapi)
})

test('parse, unknown method, and backend failures return distinct JSON-RPC errors', async () => {
  const malformed = await worker.fetch(
    new Request('https://preview.example/api/mcp', {
      method: 'POST',
      body: '{'
    }),
    env
  )
  expect(malformed.status).toBe(400)
  expect((await malformed.json()).error.code).toBe(-32700)
  const unknown = await rpc({ jsonrpc: '2.0', id: 1, method: 'unknown' })
  expect((await unknown.json()).error.code).toBe(-32601)
  const broken = await rpc(
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_pages' } },
    {},
    {
      ASSETS: {
        fetch() {
          throw new Error('Private backend detail')
        }
      }
    }
  )
  const failure = await broken.json()
  expect(failure.error.code).toBe(-32603)
  expect(failure.error.message).not.toContain('Private backend detail')
})

test('HTML asset fallbacks never become successful Markdown tool results', async () => {
  const response = await rpc(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'read_page', arguments: { pagePath: '/networks/mainnet' } }
    },
    {},
    {
      ASSETS: {
        async fetch(input) {
          if (new URL(input).pathname === '/llms.txt') return env.ASSETS.fetch(input)
          return new Response('<html>Not found</html>', {
            headers: { 'Content-Type': 'text/html' }
          })
        }
      }
    }
  )
  expect((await response.json()).result.isError).toBe(true)
})
