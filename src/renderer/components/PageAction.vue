<template>
  <button type="button" class="page-action" :class="{ 'is-primary': primary }" :disabled="disabled || busy" :aria-busy="busy || undefined">
    <svg v-if="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path v-if="icon === 'save'" d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8" />
      <path v-else-if="icon === 'reload'" d="M20 7v5h-5M20 12a8 8 0 1 0-2 5M20 7l-3-3" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>
<script setup>
defineProps({ label: String, icon: String, primary: Boolean, disabled: Boolean, busy: Boolean })
</script>
<style scoped>
.page-action { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:38px; padding:8px 14px; border:1px solid var(--ui-border,var(--fd-border)); border-radius:8px; background:var(--ui-surface-strong,var(--fd-bg-secondary)); color:var(--ui-text-primary,var(--fd-text-primary)); font:inherit; font-size:14px; line-height:20px; white-space:nowrap; cursor:pointer; }
.page-action.is-primary { background:var(--ui-action-primary,var(--fd-accent)); border-color:var(--ui-action-primary,var(--fd-accent)); color:var(--ui-action-contrast,#fff); }
.page-action:hover:not(:disabled) { filter:brightness(1.06); }
.page-action:focus-visible { outline:2px solid var(--ui-action-primary,var(--fd-accent)); outline-offset:3px; }
.page-action:disabled { opacity:.5; cursor:default; }
.page-action svg { width:16px; height:16px; flex-shrink:0; }
</style>
