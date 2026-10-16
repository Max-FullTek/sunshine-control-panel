// Read-only status polling through the existing trusted loopback proxy.
// Show only a bounded summary of the latest error; full logs stay in diagnostics.
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
    const lines = (await logs.text()).split(/\r?\n/)
    for (let index = lines.length - 1; index >= 0; index--) {
      const error = lines[index].match(/\]:\s*(?:Fatal|Error):\s*(.*)/i)
      if (error) {
        const message = error[1].replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
        return { state: 'error', message: message.length > 320 ? `${message.slice(0, 319)}…` : message }
      }
    }
    return { state: 'online' }
  } catch {
    return { state: 'offline' }
  }
}
