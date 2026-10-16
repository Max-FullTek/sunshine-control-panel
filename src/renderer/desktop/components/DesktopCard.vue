<template>
  <div
    class="desktop-card"
    :class="{
      'hoverable': hoverable,
      'clickable': clickable,
      [`card-${variant}`]: variant
    }"
    @click="handleClick"
  >
    <div v-if="showHeader" class="card-header">
      <div class="card-title">
        <component v-if="icon" :is="icon" class="title-icon" />
        <span v-if="title">{{ title }}</span>
        <slot name="title"></slot>
      </div>
      <div class="card-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <div class="card-content" :class="{ 'no-padding': noPadding }">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null
  },
  icon: {
    type: [Object, String],
    default: null
  },
  variant: {
    type: String,
    default: 'default', // default, primary, secondary, success, warning, danger
    validator: (value) => ['default', 'primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  noPadding: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style lang="less" scoped>
.desktop-card {
  background: var(--fd-bg-secondary);
  border: 1px solid rgba(var(--fd-accent-rgb, 0, 255, 245), 0.2);
  border-radius: var(--fd-card-radius, 14px);
  padding: 24px;
  transition: all 0.3s ease;

  &.hoverable:hover {
    border-color: rgba(var(--fd-accent-rgb, 0, 255, 245), 0.5);
    box-shadow: none;
    transform: translateY(-2px);
  }

  &.clickable {
    cursor: pointer;
  }

  &.card-primary {
    border-color: rgba(var(--fd-accent-rgb, 0, 255, 245), 0.4);
    background: var(--fd-bg-secondary);
  }

  &.card-secondary {
    border-color: rgba(var(--fd-accent-secondary-rgb, 255, 0, 255), 0.4);
    background: var(--fd-bg-secondary);
  }

  &.card-success {
    border-color: rgba(var(--fd-status-success-rgb, 0, 255, 136), 0.4);
    background: var(--fd-bg-secondary);
  }

  &.card-warning {
    border-color: rgba(var(--fd-status-warning-rgb, 255, 215, 0), 0.4);
    background: var(--fd-bg-secondary);
  }

  &.card-danger {
    border-color: rgba(var(--fd-status-danger-rgb, 255, 107, 53), 0.4);
    background: var(--fd-bg-secondary);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--fd-text-primary, #fff);
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        width: 20px;
        height: 20px;
        color: var(--fd-accent, #00fff5);
      }
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }
  }

  .card-content {
    color: rgba(var(--fd-text-primary-rgb, 255, 255, 255), 0.7);

    &.no-padding {
      padding: 0;
      margin: 0;
    }
  }

  .card-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(var(--fd-accent-rgb, 0, 255, 245), 0.1);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
