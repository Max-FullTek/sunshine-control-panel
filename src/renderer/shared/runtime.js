// Presentation capability only. Native commands still enforce their own permissions.
export const hasDesktopRuntime = () =>
  typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__?.invoke === 'function'
