import test from 'node:test'
import assert from 'node:assert/strict'

import { getImagePreviewUrl } from '../utils/imageUtils.js'
import { validateField } from '../utils/validation.js'

test('external cover URLs and network shares never become image sources', () => {
  for (const path of ['https://cdn.example.com/cover.jpg', 'HTTP://example.invalid/a.png', '//server/a.png', '\\\\server\\a.png', 'javascript:alert(1)', 'file://server/a.png']) {
    assert.equal(getImagePreviewUrl(path), '/boxart/box.png')
    assert.equal(validateField('imagePath', path).isValid, false)
  }
  assert.equal(getImagePreviewUrl('data:image/png;base64,abc'), 'data:image/png;base64,abc')
})

test('getImagePreviewUrl normalizes boxart and cover file names', () => {
  assert.equal(getImagePreviewUrl('Half Life.png'), '/boxart/Half%20Life.png')
  assert.equal(getImagePreviewUrl('Half%20Life.png'), '/boxart/Half%20Life.png')
  assert.equal(getImagePreviewUrl('boxart/Half%20Life.png'), '/boxart/Half%20Life.png')
})

test('getImagePreviewUrl maps localized covers paths to boxart URLs', () => {
  assert.equal(
    getImagePreviewUrl('C:\\Users\\player\\AppData\\Local\\Sunshine\\covers\\Half Life.png'),
    '/boxart/Half%20Life.png'
  )
  assert.equal(
    getImagePreviewUrl('/home/player/.config/sunshine/covers/Half%20Life.png'),
    '/boxart/Half%20Life.png'
  )
})
