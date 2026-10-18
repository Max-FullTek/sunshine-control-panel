// Compatibility aliases; all color values live in shared/palette.css.
const shared = {
  '--fd-accent': 'var(--ui-accent)',
  '--fd-accent-rgb': 'var(--ui-accent-rgb)',
  '--fd-accent-secondary': 'var(--ui-accent-secondary)',
  '--fd-accent-secondary-rgb': 'var(--ui-accent-secondary-rgb)',
  '--fd-status-success': 'var(--ui-success-text)',
  '--fd-status-success-rgb': 'var(--ui-success-text-rgb)',
  '--fd-status-warning': 'var(--ui-warning-text)',
  '--fd-status-warning-rgb': 'var(--ui-warning-text-rgb)',
  '--fd-status-danger': 'var(--ui-danger-text)',
  '--fd-status-danger-rgb': 'var(--ui-danger-text-rgb)',
  '--fd-bg-primary': 'var(--ui-shell-bg)',
  '--fd-bg-primary-rgb': 'var(--ui-shell-bg-rgb)',
  '--fd-bg-secondary': 'var(--ui-shell-surface)',
  '--fd-bg-secondary-rgb': 'var(--ui-shell-surface-rgb)',
  '--fd-bg-tertiary': 'var(--ui-shell-soft)',
  '--fd-bg-tertiary-rgb': 'var(--ui-shell-soft-rgb)',
  '--fd-text-primary': 'var(--ui-shell-text)',
  '--fd-text-primary-rgb': 'var(--ui-shell-text-rgb)',
  '--fd-text-secondary': 'var(--ui-shell-muted)',
  '--fd-text-muted': 'var(--ui-shell-faint)',
  '--fd-card-radius': '8px', '--fd-font-size': '14px',
}

export const themePresets = { light: { ...shared }, dark: { ...shared } }

export function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark'
}
