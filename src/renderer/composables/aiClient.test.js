import assert from 'node:assert/strict'
import test from 'node:test'
import { callLLM, fetchModels, proxyFetch } from './aiClient.js'

test('disabled AI rejects saved configurations and provider requests before any network access', async () => {
  let requests = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { requests++; throw new Error('Unexpected network request') }
  try {
    await assert.rejects(callLLM({ model: 'saved-model' }, []), /AI is disabled/)
    await assert.rejects(fetchModels('https://provider.invalid', 'saved-key', 'openai'), /AI is disabled/)
    await assert.rejects(proxyFetch('https://provider.invalid', 'GET'), /AI is disabled/)
    assert.equal(requests, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
