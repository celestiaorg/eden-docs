import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Vocs regenerates robots.txt; restore our policy while keeping its deployment-specific sitemap.
const robotsPath = new URL('../dist/public/robots.txt', import.meta.url)
const generatedRobots = await readFile(robotsPath, 'utf8')
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8')
await writeFile(
  robotsPath,
  robots.replace(/^Sitemap:.*$/m, generatedRobots.match(/^Sitemap:.*$/m)[0])
)

const name = 'eden-development'
const skill = await readFile(new URL(`../.agents/skills/${name}/SKILL.md`, import.meta.url))
const description = skill.toString().match(/^description: (.+)$/m)?.[1]
if (!description) throw new Error('The public Eden skill needs a description')

const directory = new URL('../dist/public/.well-known/agent-skills/', import.meta.url)
await mkdir(new URL(`${name}/`, directory), { recursive: true })
await writeFile(new URL(`${name}/SKILL.md`, directory), skill)
await writeFile(
  new URL('index.json', directory),
  JSON.stringify(
    {
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [
        {
          name,
          description,
          type: 'skill-md',
          url: `/.well-known/agent-skills/${name}/SKILL.md`,
          digest: `sha256:${createHash('sha256').update(skill).digest('hex')}`
        }
      ]
    },
    null,
    2
  ) + '\n'
)
