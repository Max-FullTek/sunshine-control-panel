<template>
  <section class="chub-page">
    <PageHeading :title="t.sidebar.deviceHub" :description="t.deviceHub.intro"><template #icon><IconGamepad /></template></PageHeading>

    <div class="chub-pane">
      <GamepadTypePicker />
      <AdvancedControllerOptions />
    </div>
  </section>
</template>

<script setup>
import IconGamepad from '../../desktop/icons/IconGamepad.vue'
import PageHeading from '../PageHeading.vue'
import AdvancedControllerOptions from './AdvancedControllerOptions.vue'
import GamepadTypePicker from './GamepadTypePicker.vue'
import { useI18n } from '../../desktop/i18n/index.js'
const { t } = useI18n()
</script>

<style lang="less">
@import '../../styles/ControllersHub.less';
</style>
