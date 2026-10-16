import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('workflow and Vocs use the actual Pages alias when truncation leaves a hyphen', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'eden-preview-'))
  try {
    const branch = 'jcstein/docs.eden.zone-site-score-improve'
    const expected = 'https://jcstein-docs-eden-zone-site.eden-docs-6l7.pages.dev'
    const env = {
      ...process.env,
      VOCS_BASE_URL: '',
      GITHUB_HEAD_REF: branch,
      GITHUB_REF_NAME: branch,
      CF_PAGES_BRANCH: branch,
      CF_PAGES_URL: 'https://hash.eden-docs-6l7.pages.dev',
      PAGES_PREVIEW_HOST: 'eden-docs-6l7.pages.dev',
      GITHUB_ENV: join(directory, 'env'),
      GITHUB_OUTPUT: join(directory, 'output')
    }
    delete env.VOCS_BASE_URL
    const workflow = await readFile('.github/workflows/deploy-cloudflare.yml', 'utf8')
    const script = workflow.match(
      /id: deployment-target\n[\s\S]*?run: \|\n([\s\S]*?)\n      - name:/
    )[1]
    const result = Bun.spawnSync(['bash', '-e', '-c', script], { env })
    expect(result.exitCode).toBe(0)
    expect(await readFile(env.GITHUB_OUTPUT, 'utf8')).toContain(`base_url=${expected}\n`)
    const config = Bun.spawnSync(
      ['bun', '-e', "import config from './vocs.config.ts'; console.log(config.baseUrl)"],
      { env }
    )
    expect(config.exitCode).toBe(0)
    expect(config.stdout.toString().trim()).toBe(expected)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
