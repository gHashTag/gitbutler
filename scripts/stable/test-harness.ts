#!/usr/bin/env -S npx tsx
import { writeFileSync, appendFileSync, existsSync } from 'fs'
import { join } from 'path'

const AGENTS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['Q27'])
const EXPERIENCE_DIR = join(process.cwd(), '.trinity', 'experience')

// Ensure experience directory exists
if (!existsSync(EXPERIENCE_DIR)) {
  console.log(`Creating experience directory: ${EXPERIENCE_DIR}`)
  writeFileSync(join(EXPERIENCE_DIR, '.gitkeep'), '')
}

// Write test event to each agent's JSONL file
for (const agent of AGENTS) {
  const event = JSON.stringify({
    agent,
    kind: 'test',
    body: `ring-080: PING from ${agent}`,
    ring: 80,
    ts: Math.floor(Date.now() / 1000)
  })

  const filePath = join(EXPERIENCE_DIR, `agent-${agent.toLowerCase()}.jsonl`)

  try {
    appendFileSync(filePath, event + '\n')
    console.log(`✅ Wrote test event for agent ${agent} to ${filePath}`)
  } catch (err) {
    console.error(`❌ Failed to write for agent ${agent}:`, err)
    process.exit(1)
  }
}

// Wait 3 seconds for FileWatcher to process
await new Promise<void>(resolve => {
  console.log('⏳ Waiting 3 seconds for FileWatcher to process events...')
  setTimeout(resolve, 3000)
})

// Verify all 27 events written
console.log(`✅ Test complete: ${AGENTS.length} events written to .trinity/experience/`)
console.log('Expected: 27/27 events should appear in StableChat within 3 seconds')
