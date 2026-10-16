import { expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const script = await readFile(new URL('../public/webmcp.js', import.meta.url), 'utf8')

function load({ context, legacy, fetch, warn = () => {} } = {}) {
  runInNewContext(script, {
    document: { modelContext: context },
    navigator: { modelContext: legacy },
    fetch,
    Promise,
    URLSearchParams,
    console: { warn }
  })
}

test('registers a read-only search tool on current and legacy WebMCP hosts', () => {
  load()
  for (const host of ['context', 'legacy']) {
    const tools = []
    load({ [host]: { registerTool: tool => tools.push(tool) } })
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('search_eden_docs')
    expect(tools[0].annotations.readOnlyHint).toBe(true)
    expect(tools[0].inputSchema.required).toEqual(['query'])
  }
  let calls = 0
  load({
    context: { registerTool: () => calls++ },
    legacy: {
      registerTool: () => {
        throw new Error('Legacy host must not be used')
      }
    }
  })
  expect(calls).toBe(1)
})

test('search encodes input, forwards cancellation, and preserves REST errors', async () => {
  let tool
  let calls = 0
  let response = Response.json({ results: [{ path: '/networks/mainnet', snippet: 'Eden' }] })
  const controller = new AbortController()
  load({
    context: {
      registerTool: value => {
        tool = value
      }
    },
    fetch: async (path, options) => {
      calls++
      const url = new URL(path, 'https://preview.example')
      expect(url.pathname).toBe('/api/v1/search')
      expect([...url.searchParams]).toEqual([['query', 'Eden & path=/private?#']])
      expect(options.signal).toBe(controller.signal)
      return response
    }
  })
  for (const args of [undefined, null, {}, { query: '' }, { query: '  ' }, { query: 42 }]) {
    expect((await tool.execute(args)).error.code).toBe('INVALID_PARAMETER')
  }
  expect(calls).toBe(0)
  const search = () =>
    tool.execute({ query: 'Eden & path=/private?#' }, { signal: controller.signal })
  expect(await search()).toEqual({ results: [{ path: '/networks/mainnet', snippet: 'Eden' }] })
  const error = { code: 'DOCS_UNAVAILABLE', message: 'Unavailable', hint: 'Retry later' }
  response = Response.json({ error }, { status: 503 })
  expect(await search()).toEqual({ error })
  response = new Response('<html>Hosting error</html>', { status: 502 })
  expect((await search()).error.code).toBe('SEARCH_UNAVAILABLE')
})

test('network and registration failures do not break the page', async () => {
  let tool
  load({
    context: {
      registerTool: value => {
        tool = value
      }
    },
    fetch: async () => {
      throw new TypeError('Network unavailable')
    }
  })
  expect((await tool.execute({ query: 'Eden' })).error.code).toBe('SEARCH_UNAVAILABLE')
  const warnings = []
  for (const registerTool of [
    () => {
      throw new Error('Registration denied')
    },
    () => Promise.reject(new Error('Registration denied'))
  ]) {
    load({ context: { registerTool }, warn: message => warnings.push(message) })
  }
  await Promise.resolve()
  expect(warnings).toHaveLength(2)
})
