import { test } from 'node:test'
import assert from 'node:assert/strict'
import { manageModalLifecycle } from '../utils/modalLifecycle.js'

function fixture() {
  const element = new EventTarget()
  const calls = []
  const emit = name => element.dispatchEvent(new Event(`${name}.bs.modal`))
  const release = manageModalLifecycle(element, {
    hide() { calls.push('hide'); emit('hide') },
    dispose() { calls.push('dispose') },
  }, () => calls.push('close'))
  return { emit, calls, release }
}

test('cancel and header dismissal notify parent only after backdrop finishes', () => {
  const { emit, calls, release } = fixture()
  emit('show'); emit('shown'); emit('hide')
  assert.deepEqual(calls, [])
  emit('hidden')
  assert.deepEqual(calls, ['close'])
  release(); release()
  assert.deepEqual(calls, ['close', 'dispose'])
})

test('unmount during hide waits for hidden and does not notify removed parent', () => {
  const { emit, calls, release } = fixture()
  emit('show'); emit('shown'); emit('hide'); release()
  assert.deepEqual(calls, [])
  emit('hidden')
  assert.deepEqual(calls, ['dispose'])
  emit('hidden')
  assert.deepEqual(calls, ['dispose'])
})

test('navigation during opening waits for shown, hides, then disposes', () => {
  const { emit, calls, release } = fixture()
  emit('show'); release()
  assert.deepEqual(calls, [])
  emit('shown')
  assert.deepEqual(calls, ['hide'])
  emit('hidden')
  assert.deepEqual(calls, ['hide', 'dispose'])
})

test('successful save unmount hides a visible modal before disposing', () => {
  const { emit, calls, release } = fixture()
  emit('show'); emit('shown'); release()
  assert.deepEqual(calls, ['hide'])
  emit('hidden')
  assert.deepEqual(calls, ['hide', 'dispose'])
})
