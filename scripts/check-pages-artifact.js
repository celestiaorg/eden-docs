import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../dist/public/${path}`, import.meta.url), 'utf8')
const index = await read('llms.txt')
const pages = [...index.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map(match => match[1])
assert.ok(pages.length > 0, 'The documentation index must contain pages')

for (const path of pages) {
  const name = path.replace(/^\//, '')
  const html = await read(name === 'index' ? 'index.html' : `${name}/index.html`)
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0])
  const markdown = await read(`${name}.md`)
  assert.match(markdown, /^# /m, path)
  assert.equal(markdown, await read(`assets/md/${name}.md`), path)
  for (const [rel, target] of [
    ['ai-catalog', '/.well-known/ai-catalog.json'],
    ['api-catalog', '/.well-known/api-catalog'],
    ['describedby', '/.well-known/agent-skills/index.json']
  ]) {
    assert.ok(
      links.some(link => link.includes(`rel="${rel}"`) && link.includes(`href="${target}"`)),
      `${path}: ${rel} ${target}`
    )
  }
}

const skills = JSON.parse(await read('.well-known/agent-skills/index.json'))
assert.ok(skills.skills.length > 0, 'The skill index must contain skills')
for (const skill of skills.skills) {
  const published = await read(skill.url.slice(1))
  const source = await readFile(
    new URL(`../.agents/skills/${skill.name}/SKILL.md`, import.meta.url),
    'utf8'
  )
  assert.equal(published, source)
  assert.equal(skill.digest, `sha256:${createHash('sha256').update(published).digest('hex')}`)
}
assert.equal(
  await read('_worker.js'),
  await readFile(new URL('../worker/index.js', import.meta.url), 'utf8')
)
assert.ok(JSON.parse(await read('openapi.json')).paths['/api/mcp'])
const robots = await read('robots.txt')
assert.match(robots, /User-agent: \*\nContent-Signal: search=yes, ai-input=yes\n/)
assert.doesNotMatch(robots, /ai-train\s*=/)
const origin = new URL((await read('sitemap.xml')).match(/<loc>([^<]+)<\/loc>/)[1]).origin
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))

const home = await read('index.html')
assert.match(home, /<title>[^<]*Eden docs[^<]*EVM network/)
const structured = [...home.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
  match => JSON.parse(match[1])
)
const graph = structured.flatMap(item => item['@graph'] ?? [item])
const publisherId = graph.find(item => item['@type'] === 'WebSite')?.publisher['@id']
const publisher = graph.find(item => item['@id'] === publisherId)
assert.equal(publisher?.['@type'], 'Organization')
assert.equal(publisher.contactPoint.contactType, 'security disclosures')
assert.equal(publisher.contactPoint.email, 'security@celestia.org')
assert.equal(publisher.address, undefined, 'Do not invent an organization postal address')
for (const path of ['developers', 'about', 'contact', 'privacy']) {
  assert.ok(pages.includes(`/${path}`), `${path} must be discoverable in llms.txt`)
  assert.ok(home.includes(`href="/${path}"`), `${path} must be linked from home`)
  assert.ok((await read(`${path}.md`)).length > 500)
}
assert.ok((await read('privacy/index.html')).includes('href="https://celestia.org/privacy/"'))
assert.ok((await read('contact/index.html')).includes('href="mailto:security@celestia.org"'))
assert.match(await read('developers.md'), /Foundry.*Forge and Cast CLI/)
assert.match(await read('use-the-docs-with-ai.md'), /## Versioning and deprecation/)
assert.match(await read('use-the-docs-with-ai.md'), /## Rate limits/)
assert.ok(pages.includes('/api-reference'), 'REST API reference must be in llms.txt')
assert.ok(home.includes('href="/api-reference"'), 'REST API reference must be linked from home')
const apiReference = await read('api-reference.md')
for (const path of ['/api/v1/pages', '/api/v1/page', '/api/v1/search']) {
  assert.ok(apiReference.includes(path), `REST reference must document ${path}`)
  assert.ok(JSON.parse(await read('openapi.json')).paths[path]?.get)
}
assert.match(apiReference, /## Versioning and deprecation/)
assert.match(apiReference, /DOCS_UNAVAILABLE/)

console.log(
  `Verified ${pages.length} Markdown pages, HTML discovery links, skill digests, and Pages worker.`
)
