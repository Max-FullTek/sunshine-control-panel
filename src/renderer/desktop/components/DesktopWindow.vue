<template>
  <div class="desktop-window" :class="windowClass">
    <slot name="titlebar">
      <TitleBar v-if="showTitleBar" :title="title" :icon="icon" />
    </slot>

    <div class="desktop-window-content" :class="{ 'has-sidebar': hasSidebar }">
      <slot name="sidebar"></slot>

      <main class="desktop-window-main">
        <slot></slot>
      </main>
    </div>

    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TitleBar from './TitleBar.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Desktop Application'
  },
  icon: {
    type: String,
    default: null
  },
  showTitleBar: {
    type: Boolean,
    default: true
  },
  hasSidebar: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'dark', // dark, light
    validator: (value) => ['dark', 'light'].includes(value)
  }
})

const windowClass = computed(() => {
  return {
    [`theme-${props.theme}`]: true
  }
})
</script>

<style lang="less" scoped>
.desktop-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--fd-bg-primary);
  color: var(--fd-text-primary, #ffffff);
  font-size: var(--fd-font-size, 14px);
  position: relative;

  .desktop-window-content {
    flex: 1;
    display: flex;
    position: relative;
    z-index: 2;
    height: 100vh;
    overflow: hidden;

    &.has-sidebar {
      height: 100vh;
    }
  }

  .desktop-window-main {
    flex: 1;
    padding: 32px 40px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    z-index: 2;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(var(--fd-accent-rgb, 0, 255, 245), 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba(var(--fd-accent-rgb, 0, 255, 245), 0.3);
      }
    }
  }

  @media (max-width: 900px) {
    .desktop-window-main {
      padding: 24px 28px;
    }
  }
}

</style>
