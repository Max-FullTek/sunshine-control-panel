import {
  Monitor,
  Setting,
  Operation,
  Connection,
  House,
  Grid,
  QuestionFilled,
  Tools,
} from '@element-plus/icons-vue'
import IconGamepad from '../desktop/icons/IconGamepad.vue'
import { ROUTES } from './useRouter.js'
import { WEBUI_PAGES, getWebuiPage } from './webuiNavigation.js'

export const WEBUI_ICONS = {
  overview: House,
  apps: Grid,
  pairing: Connection,
  'stream-settings': Operation,
}

/** Navigation represents destinations; actions and feature status live on their pages. */
export function createNavigationGroups(ctx) {
  const labels = ctx.t.value.sidebar
  const routeItem = (id, icon, label, route) => ({
    id,
    icon,
    label,
    action: () => ctx.router.navigate(route),
    isActive: () => ctx.router.isRoute(route),
  })
  return [
    {
      id: 'stream',
      label: labels.sectionStream,
      items: [...WEBUI_PAGES.filter((page) => page.id !== 'overview').map((page) => ({
        id: page.id,
        icon: WEBUI_ICONS[page.id],
        label: labels[page.label],
        action: () => ctx.openWebUi(page.path),
        isActive: () => ctx.router.isRoute(ROUTES.HOME) && getWebuiPage(ctx.webuiPath.value)?.id === page.id,
      })),
        routeItem('vdd', Monitor, labels.virtualDisplay, ROUTES.VDD_SETTINGS),
        {
          id: 'device-hub',
          icon: IconGamepad,
          label: labels.deviceHub,
          action: ctx.openControllers,
          isActive: () =>
            [ROUTES.CONTROLLERS, ROUTES.DUALSENSE, ROUTES.CONTROLLERS_HUB].some((route) => ctx.router.isRoute(route)),
        },
      ],
    },
  ]
}

export function createFooterTools(ctx) {
  return [
    {
      id: 'troubleshooting',
      icon: Tools,
      label: ctx.t.value.sidebar.diagnostics,
      action: () => ctx.openWebUi('/troubleshooting'),
      isActive: () =>
        ctx.router.isRoute(ROUTES.HOME) && /^\/troubleshooting(?:\.html)?(?:[?#]|$)/.test(ctx.webuiPath.value),
    },
    {
      id: 'panel-settings',
      icon: Setting,
      label: ctx.t.value.sidebar.panelSettings,
      action: () => ctx.router.navigate(ROUTES.PANEL_SETTINGS),
      isActive: () =>
        ctx.router.isRoute(ROUTES.PANEL_SETTINGS) ||
        (ctx.router.isRoute(ROUTES.HOME) && /^\/password(?:\.html)?(?:[?#]|$)/.test(ctx.webuiPath.value)),
    },
    {
      id: 'help',
      icon: QuestionFilled,
      label: ctx.t.value.sidebar.helpAbout,
      action: () => ctx.router.navigate(ROUTES.HELP),
      isActive: () => ctx.router.isRoute(ROUTES.HELP),
    },
  ]
}
