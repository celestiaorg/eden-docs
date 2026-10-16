const modelContext = document.modelContext ?? navigator.modelContext

if (typeof modelContext?.registerTool === 'function') {
  const tool = {
    name: 'search_eden_docs',
    description: 'Search Eden developer documentation. Returns matching page paths and snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', pattern: '\\S', description: 'Text to find in the documentation' }
      },
      required: ['query'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true },
    async execute(args, options) {
      if (typeof args?.query !== 'string' || !args.query.trim()) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Supply a non-empty query string.' } }
      }
      try {
        const response = await fetch(
          `/api/v1/search?${new URLSearchParams({ query: args.query })}`,
          {
            headers: { Accept: 'application/json' },
            signal: options?.signal
          }
        )
        const result = await response.json()
        if (!response.ok && !result.error) throw new Error('Unexpected search response')
        return result
      } catch {
        return {
          error: {
            code: 'SEARCH_UNAVAILABLE',
            message: 'Search could not complete. Retry or browse /llms.txt.'
          }
        }
      }
    }
  }

  // Registration lasts for this document, including client-side navigation.
  try {
    Promise.resolve(modelContext.registerTool(tool)).catch(error => {
      console.warn('Eden WebMCP registration failed', error)
    })
  } catch (error) {
    console.warn('Eden WebMCP registration failed', error)
  }
}
