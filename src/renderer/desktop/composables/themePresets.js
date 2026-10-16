const shared = {
  '--fd-accent': '#2563eb', '--fd-accent-rgb': '37, 99, 235',
  '--fd-accent-secondary': '#2563eb', '--fd-accent-secondary-rgb': '37, 99, 235',
  '--fd-status-success': '#16804a', '--fd-status-success-rgb': '22, 128, 74',
  '--fd-status-warning': '#a16207', '--fd-status-warning-rgb': '161, 98, 7',
  '--fd-status-danger': '#dc2626', '--fd-status-danger-rgb': '220, 38, 38',
  '--fd-card-radius': '8px', '--fd-font-size': '14px',
}

export const themePresets = {
  light: {
    ...shared,
    '--fd-bg-primary': '#f4f5f7', '--fd-bg-primary-rgb': '244, 245, 247',
    '--fd-bg-secondary': '#ffffff', '--fd-bg-secondary-rgb': '255, 255, 255',
    '--fd-bg-tertiary': '#e9edf2', '--fd-bg-tertiary-rgb': '233, 237, 242',
    '--fd-text-primary': '#17212f', '--fd-text-primary-rgb': '23, 33, 47',
    '--fd-text-secondary': '#465264', '--fd-text-muted': '#5d6878',
  },
  dark: {
    ...shared,
    '--fd-accent': '#8ab4ff', '--fd-accent-rgb': '138, 180, 255',
    '--fd-accent-secondary': '#8ab4ff', '--fd-accent-secondary-rgb': '138, 180, 255',
    '--fd-bg-primary': '#171a20', '--fd-bg-primary-rgb': '23, 26, 32',
    '--fd-bg-secondary': '#20252d', '--fd-bg-secondary-rgb': '32, 37, 45',
    '--fd-bg-tertiary': '#2b323d', '--fd-bg-tertiary-rgb': '43, 50, 61',
    '--fd-text-primary': '#edf0f5', '--fd-text-primary-rgb': '237, 240, 245',
    '--fd-text-secondary': '#bac3d0', '--fd-text-muted': '#a1adbd',
    '--fd-status-success': '#75d7a0', '--fd-status-success-rgb': '117, 215, 160',
    '--fd-status-warning': '#f0c574', '--fd-status-warning-rgb': '240, 197, 116',
    '--fd-status-danger': '#ff9898', '--fd-status-danger-rgb': '255, 152, 152',
  },
}

export function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark'
}
