export function hasDesktopLogAccess(context = globalThis.window) {
  return typeof context?.__TAURI_INTERNALS__?.invoke === 'function'
}

export function formatDesktopLogs(entries, { search = '', level = '' } = {}) {
  const needle = search.toLocaleLowerCase()
  return entries.filter(entry => !level || entry.level === level)
    .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.file || entry.target || ''}${entry.line ? ':' + entry.line : ''} ${entry.message}`)
    .filter(line => !needle || line.toLocaleLowerCase().includes(needle)).join('\n')
}

export const desktopLogText = {
  zh_TW: {
    host: 'Sunshine 主機記錄', desktop: '桌面程式記錄', title: '桌面診斷',
    description: '包含啟動、控制面板連線與桌面功能記錄。自動保存最近兩份檔案，總量最多約 4 MiB；畫面顯示最近 2,000 筆。',
    level: '記錄等級', download: '下載桌面記錄', all: '所有等級', path: '記錄檔案', failure: '無法讀取記錄', storageFailure: '無法保存記錄',
    back: '前往疑難排解', empty: '目前沒有符合條件的記錄。', sample: '範例資料；下載停用。',
  },
  zh: {
    host: 'Sunshine 主机日志', desktop: '桌面程序日志', title: '桌面诊断',
    description: '包含启动、控制面板连接与桌面功能日志。自动保存最近两份文件，总量最多约 4 MiB；界面显示最近 2,000 条。',
    level: '日志级别', download: '下载桌面日志', all: '所有级别', path: '日志文件', failure: '无法读取日志', storageFailure: '无法保存日志',
    back: '前往故障排除', empty: '目前没有符合条件的日志。', sample: '示例数据；下载已停用。',
  },
  en: {
    host: 'Sunshine host logs', desktop: 'Desktop app logs', title: 'Desktop diagnostics',
    description: 'Startup, control panel connection and desktop feature logs. Two rotating files retain up to approximately 4 MiB; the latest 2,000 entries are displayed.',
    level: 'Log level', download: 'Download desktop logs', all: 'All levels', path: 'Log file', failure: 'Unable to read logs', storageFailure: 'Unable to save logs',
    back: 'Go to troubleshooting', empty: 'No matching log entries.', sample: 'Sample data; download disabled.',
  },
}
