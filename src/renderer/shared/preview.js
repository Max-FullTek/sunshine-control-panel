// Set only by the explicit, read-only local sample server. This never grants IPC.
export const isNativeUiPreview = () => typeof window !== 'undefined'
  && window.__FOUNDATION_PREVIEW_SAMPLE__ === true
  && ['127.0.0.1', 'localhost'].includes(window.location.hostname)
