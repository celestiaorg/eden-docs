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
console.log(
  `Verified ${pages.length} Markdown pages, HTML discovery links, skill digests, and Pages worker.`
)
