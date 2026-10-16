import test from 'node:test'
import assert from 'node:assert/strict'
import { readHostStatus } from './hostStatus.js'

test('status distinguishes unavailable hosts, authentication, and fatal log entries', async () => {
  assert.equal((await readHostStatus('', async () => { throw new Error('network') })).state, 'offline')
  assert.equal((await readHostStatus('', async () => new Response('', { status: 401 }))).state, 'authentication')
  for (const [log, expected] of [['[2026-10-16 12:00:00.000]: Fatal: encoder failed', 'error'], ['[2026-10-16 12:00:00.000]: Error: capture failed', 'error'], ['Info: Ready', 'online']]) {
    const request = async (url) => url.endsWith('/api/config')
      ? Response.json({ platform: 'windows' }) : new Response(log)
    assert.equal((await readHostStatus('', request)).state, expected)
  }
  const request = async (url) => url.endsWith('/api/config')
    ? Response.json({ platform: 'windows' }) : new Response('', { status: 500 })
  assert.equal((await readHostStatus('', request)).state, 'logsUnavailable')
})
