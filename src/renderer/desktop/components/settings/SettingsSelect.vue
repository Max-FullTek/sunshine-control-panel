<template>
  <span class="settings-select-wrapper">
  <select class="settings-select" :value="modelValue" @change="handleChange">
    <option
      v-for="option in options"
      :key="String(option.value)"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
  <svg class="select-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
  </span>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

function handleChange(event) {
  const selected = props.options.find(option => String(option.value) === event.target.value)
  const nextValue = selected ? selected.value : event.target.value
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}
</script>

<style lang="less" scoped>
.settings-select-wrapper { display:inline-flex; position:relative; color:var(--fd-text-secondary); max-width:100%; }
.select-chevron { position:absolute; right:12px; top:50%; transform:translateY(-50%); width:14px; height:14px; pointer-events:none; }
.settings-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid rgba(var(--fd-accent-rgb, 0, 255, 245), 0.2);
  border-radius: 8px;
  background: var(--fd-bg-secondary);
  color: var(--fd-text-primary, #fff);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  max-width: 100%;

  &:focus {
    outline: none;
    border-color: var(--fd-accent, #00fff5);
  }

  option {
    background: var(--fd-bg-secondary, #1a1a2e);
    color: var(--fd-text-primary, #fff);
  }
}
</style>
