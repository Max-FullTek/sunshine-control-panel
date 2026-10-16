// Read-only status polling through the existing trusted loopback proxy.
// Keep log contents out of the shell; details remain on the diagnostics page.
export async function readHostStatus(proxyBase, request = fetch) {
  try {
    const config = await request(`${proxyBase}/api/config`, { signal: AbortSignal.timeout(5000) })
    if (config.status === 401 || config.status === 403) return { state: 'authentication' }
    if (!config.ok) return { state: 'offline' }
    const data = await config.json()
    if (!data || typeof data !== 'object' || !data.platform) return { state: 'offline' }
    const logs = await request(`${proxyBase}/api/logs`, {
      headers: { 'X-Log-Offset': '0' }, signal: AbortSignal.timeout(5000),
    })
    if (!logs.ok) return { state: 'logsUnavailable' }
    return { state: /\]:\s*(?:Fatal|Error):/i.test(await logs.text()) ? 'error' : 'online' }
  } catch {
    return { state: 'offline' }
  }
}
