// Retain the original panel palettes from styles/theme.less.
const shared = {
  '--fd-accent': '#4a9eff', '--fd-accent-rgb': '74, 158, 255',
  '--fd-accent-secondary': '#4a9eff', '--fd-accent-secondary-rgb': '74, 158, 255',
  '--fd-status-success': '#16804a', '--fd-status-success-rgb': '22, 128, 74',
  '--fd-status-warning': '#a16207', '--fd-status-warning-rgb': '161, 98, 7',
  '--fd-status-danger': '#dc2626', '--fd-status-danger-rgb': '220, 38, 38',
  '--fd-card-radius': '8px', '--fd-font-size': '14px',
}

export const themePresets = {
  light: {
    ...shared,
    '--fd-bg-primary': '#f0f8ff', '--fd-bg-primary-rgb': '240, 248, 255',
    '--fd-bg-secondary': '#ffffff', '--fd-bg-secondary-rgb': '255, 255, 255',
    '--fd-bg-tertiary': '#e6f2ff', '--fd-bg-tertiary-rgb': '230, 242, 255',
    '--fd-text-primary': '#17212f', '--fd-text-primary-rgb': '23, 33, 47',
    '--fd-text-secondary': '#465264', '--fd-text-muted': '#5d6878',
  },
  dark: {
    ...shared,
    '--fd-accent': '#e6d5b8', '--fd-accent-rgb': '230, 213, 184',
    '--fd-accent-secondary': '#e6d5b8', '--fd-accent-secondary-rgb': '230, 213, 184',
    '--fd-bg-primary': '#2d2628', '--fd-bg-primary-rgb': '45, 38, 40',
    '--fd-bg-secondary': '#3d3235', '--fd-bg-secondary-rgb': '61, 50, 53',
    '--fd-bg-tertiary': '#4a3f42', '--fd-bg-tertiary-rgb': '74, 63, 66',
    '--fd-text-primary': '#f5f0eb', '--fd-text-primary-rgb': '245, 240, 235',
    '--fd-text-secondary': '#ddd1d4', '--fd-text-muted': '#b7a8ac',
    '--fd-status-success': '#75d7a0', '--fd-status-success-rgb': '117, 215, 160',
    '--fd-status-warning': '#f0c574', '--fd-status-warning-rgb': '240, 197, 116',
    '--fd-status-danger': '#ff9898', '--fd-status-danger-rgb': '255, 152, 152',
  },
}

export function normalizeTheme(value) {
  return value === 'light' ? 'light' : 'dark'
}
