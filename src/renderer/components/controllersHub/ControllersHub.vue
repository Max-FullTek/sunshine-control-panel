<template>
  <section class="chub-page">
    <header class="chub-header">
      <span class="chub-header-icon" aria-hidden="true"><IconGamepad /></span>
      <div class="chub-header-copy">
        <h1>{{ t.controllers.title }}</h1>
        <p class="chub-intro">{{ t.deviceHub.intro }}</p>
      </div>
    </header>

    <div class="chub-pane">
      <GamepadTypePicker />
      <AdvancedControllerOptions />
    </div>
  </section>
</template>

<script setup>
import IconGamepad from '../../desktop/icons/IconGamepad.vue'
import AdvancedControllerOptions from './AdvancedControllerOptions.vue'
import GamepadTypePicker from './GamepadTypePicker.vue'
import { useI18n } from '../../desktop/i18n/index.js'
const { t } = useI18n()
</script>

<style lang="less">
@import '../../styles/ControllersHub.less';
</style>
