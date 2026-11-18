import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.each([
  ['success', [0], 0, '', 1],
  ['recovery', [2, 0], 0, '10\n', 1],
  ['persistent broken links', [2, 2, 2], 2, '10\n20\n', 1],
  ['configuration error', [1], 1, '', 1],
  ['empty scan', [0], 1, '', 0]
])(
  'link checks preserve failures and bound retries: %s',
  async (_, statuses, exitCode, waits, total) => {
    const directory = await mkdtemp(join(tmpdir(), 'eden-links-'))
    const count = join(directory, 'count')
    const args = join(directory, 'args')
    const delays = join(directory, 'delays')
    const summary = join(directory, 'summary')
    try {
      await writeFile(count, '0')
      await writeFile(delays, '')
      await writeFile(
        join(directory, 'lychee'),
        `#!/usr/bin/env bash
attempt=$(($(cat "$LINK_CHECK_COUNT") + 1))
echo "$attempt" > "$LINK_CHECK_COUNT"
printf '%s\\n' "$@" > "$LINK_CHECK_ARGS"
printf '| Total | %s |\\n' "$LINK_CHECK_TOTAL" > "$6"
statuses=(${statuses.join(' ')})
exit "\${statuses[$((attempt - 1))]:-99}"
`,
        { mode: 0o755 }
      )
      await writeFile(join(directory, 'sleep'), '#!/bin/sh\necho "$1" >> "$LINK_CHECK_DELAYS"\n', {
        mode: 0o755
      })
      const result = Bun.spawnSync(['bash', 'scripts/check-links.sh', 'docs/pages'], {
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          LINK_CHECK_COUNT: count,
          LINK_CHECK_ARGS: args,
          LINK_CHECK_DELAYS: delays,
          LINK_CHECK_TOTAL: String(total),
          GITHUB_STEP_SUMMARY: summary
        }
      })
      expect(result.exitCode).toBe(exitCode)
      expect(Number(await readFile(count, 'utf8'))).toBe(statuses.length)
      expect(await readFile(delays, 'utf8')).toBe(waits)
      expect((await readFile(args, 'utf8')).trim().split('\n')).toEqual([
        '--config',
        './lychee.toml',
        '--format',
        'markdown',
        '--output',
        expect.any(String),
        'docs/pages'
      ])
      expect(await readFile(summary, 'utf8')).toBe(`| Total | ${total} |\n`)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }
)
