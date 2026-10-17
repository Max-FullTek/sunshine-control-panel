/**
 * 图片工具函数
 * 用于处理应用图片URL的标准化逻辑
 */
/**
 * 获取图片预览URL
 * @param {string} imagePath 图片路径
 * @returns {string} 预览URL
 */
export function getImagePreviewUrl(imagePath = 'box.png') {
  if (imagePath === 'desktop') {
    return '/boxart/desktop.png'
  }
  if (/^(blob:|data:image\/png;base64,)/i.test(imagePath)) {
    return imagePath
  }
  if (!isLocalImagePath(imagePath)) {
    return '/boxart/box.png'
  }
  if (imagePath.startsWith('/boxart/') || imagePath.startsWith('boxart/')) {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  }
  // 如果路径不包含分隔符,说明是boxart资源ID
  if (!/[/\\]/.test(imagePath)) {
    return `/boxart/${encodeBoxArtName(imagePath)}`
  }

  if (/[\\/]covers[\\/]/i.test(imagePath)) {
    return `/boxart/${encodeBoxArtName(imagePath.split(/[/\\]/).pop())}`
  }

  return isLocalImagePath(imagePath) ? `file://${imagePath}` : imagePath
}

function encodeBoxArtName(name) {
  const value = String(name || '')
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

/**
 * 检查图片路径是否为本地文件路径
 * @param {string} imagePath 图片路径
 * @returns {boolean} 是否为本地文件路径
 */
export function isLocalImagePath(imagePath) {
  if (!imagePath) {
    return false
  }

  // Network shares and URI schemes are not local application cover paths.
  if (/^[\\/]{2}/.test(imagePath)) {
    return false
  }
  const colon = imagePath.indexOf(':')
  return colon === -1 || (
    /^[a-z]:[\\/]/i.test(imagePath) && imagePath.indexOf(':', colon + 1) === -1
  )
}
