import { isWebuiNavigationPath } from '../composables/webuiNavigation.js'

export function sharedUiPath(requested) {
  try {
    const url = new URL(requested)
    const path = url.pathname + url.search + url.hash
    return isWebuiNavigationPath(path) || path === '/welcome' ? path : '/'
  } catch {
    return '/'
  }
}

export async function verifySharedUi(proxy, request = fetch) {
  const response = await request(new URL('/', proxy).href, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
  return response.ok && /<meta\s+name="foundation-shared-ui"\s+content="1"\s*\/?\s*>/.test(await response.text())
}
