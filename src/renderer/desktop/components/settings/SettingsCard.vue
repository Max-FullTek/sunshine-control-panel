<template>
  <section class="desktop-card fade-in settings-card">
    <div class="card-header">
      <div class="card-title">
        <span class="title-icon">
          <component :is="icon" />
        </span>
        {{ title }}
      </div>
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="card-content">
      <slot></slot>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: [Object, Function, String],
    required: true,
  },
})
</script>

<style lang="less" scoped>
.settings-card {
  margin-bottom: 22px;
  padding: 22px;
  background: var(--fd-bg-secondary);
  border: 1px solid var(--fd-border);
  border-radius: 16px;
}
.card-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; padding:0 0 16px; background:transparent; border-bottom:1px solid var(--fd-border); }
.card-title { display:flex; align-items:center; gap:8px; margin:0; font-size:16px; font-weight:600; color:var(--fd-text-primary); }
.title-icon { display:inline-flex; flex:0 0 20px; width:20px; height:20px; color:var(--fd-accent); }
.title-icon :deep(svg) { display:block; width:20px; height:20px; }
</style>
