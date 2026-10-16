<template>
  <header class="page-heading">
    <div class="page-heading-title">
      <span class="page-heading-icon" aria-hidden="true"><slot name="icon" /></span>
      <div><h1>{{ title }}</h1><p v-if="description">{{ description }}</p><slot name="meta" /></div>
    </div>
    <div v-if="$slots.actions" class="page-heading-actions"><slot name="actions" /></div>
  </header>
</template>
<script setup>
defineProps({ title: String, description: String })
</script>
<style scoped>
.page-heading { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; padding:10px 0 20px; }
.page-heading-title { display:flex; align-items:center; gap:14px; min-width:0; }
.page-heading h1 { font-size:26px; font-weight:650; line-height:1.3; margin:0; color:var(--fd-text-primary); }
.page-heading p { margin:6px 0 0; font-size:14px; line-height:1.6; color:var(--fd-text-secondary); }
.page-heading-icon { display:flex; align-items:center; justify-content:center; flex:0 0 52px; width:52px; height:52px; border:1px solid var(--fd-border); border-radius:14px; background:var(--fd-bg-tertiary); font-size:25px; }
.page-heading-icon :deep(svg) { width:25px; height:25px; }
.page-heading-actions { display:flex; flex-wrap:wrap; gap:10px; }
</style>
