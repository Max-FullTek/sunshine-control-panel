<template>
  <article class="app-card" :class="{ 'app-card-dragging': isDragging }">
    <div class="app-card-inner">
      <div class="app-cover">
        <img v-if="app['image-path'] && !imageFailed" :src="getImageUrl()" alt=""
          class="app-cover-image" loading="lazy" decoding="async" draggable="false" @error="handleImageError" />
        <div v-else class="app-cover-placeholder" aria-hidden="true"><i class="fas fa-desktop"></i></div>
        <div v-if="hasTags" class="app-tags">
          <div v-for="tag in visibleTags" :key="tag.key" class="app-tag-trigger">
            <button type="button" class="app-status-bubble" :class="tag.className" :disabled="disabled"
              :aria-label="`${tag.label}: ${tag.title}`" @click="$emit('edit', tag.key)">
              <span v-if="tag.count">{{ tag.count }}</span>
              <i v-else class="fas" :class="tag.icon" aria-hidden="true"></i>
              <span class="app-tag-details" aria-hidden="true"><span class="app-tag-detail-content"><strong>{{ tag.label }}</strong><span>{{ tag.title }}</span></span></span>
            </button>
          </div>
          <div v-if="hiddenTagCount > 0" class="app-tag-trigger">
            <button type="button" class="app-status-bubble tag-more" :disabled="disabled" :aria-label="tagSummaryTitle">+{{ hiddenTagCount }}</button>
            <div class="app-tag-details"><div class="app-tag-detail-content">
              <button v-for="tag in hiddenTags" :key="tag.key" type="button" class="app-tag-detail-link" :disabled="disabled" @click="$emit('edit', tag.key)"><strong>{{ tag.label }}</strong><span>{{ tag.title }}</span></button>
            </div></div>
          </div>
        </div>
        <div class="app-actions">
          <button class="app-bubble btn-edit" type="button" :disabled="disabled" :aria-label="`${$t('apps.edit')}: ${app.name}`"
            :title="$t('apps.edit')" @click="$emit('edit')"><i class="fas fa-edit" aria-hidden="true"></i></button>
          <button class="app-bubble btn-delete" type="button" :disabled="disabled" :aria-label="`${$t('_common.delete')}: ${app.name}`"
            :title="$t('apps.delete')" @click="$emit('delete')"><i class="fas fa-trash" aria-hidden="true"></i></button>
        </div>
        <div v-if="draggable" class="app-bubble drag-handle" role="img" :aria-label="$t('apps.menu_cmd_drag_sort')" :title="$t('apps.menu_cmd_drag_sort')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </div>
      </div>
      <h3 class="app-name" :title="app.name">{{ app.name }}</h3>
    </div>
  </article>
</template>
<script>
import { getImagePreviewUrl } from '../utils/imageUtils.js'
export default {
  name: 'AppCard',
  props: {
    disabled: { type: Boolean, default: false },
    app: { type: Object, required: true },
    draggable: { type: Boolean, default: true },
    isDragging: { type: Boolean, default: false },
  },
  emits: ['edit', 'delete'],
  data() { return { imageFailed: false } },
  watch: { 'app.image-path'() { this.imageFailed = false } },
  computed: {
    tagItems() {
      const tags = [];

      if (this.app['exclude-global-prep-cmd'] && this.app['exclude-global-prep-cmd'] !== 'false') {
        tags.push({
          key: 'exclude-global-prep-cmd',
          className: 'tag-exclude-global-prep-cmd',
          icon: 'fa-ellipsis-h',
          label: this.$t('apps.tag_skip_prep'),
          title: this.$t('apps.tag_skip_prep_desc'),
        });
      }

      if (this.app['menu-cmd'] && this.app['menu-cmd'].length > 0) {
        tags.push({
          key: 'menu-cmd',
          className: 'tag-menu',
          count: this.app['menu-cmd'].length,
          label: this.$t('apps.tag_menu'),
          title: this.$t('apps.menu_cmd_name'),
        });
      }

      if (this.app.elevated && this.app.elevated !== 'false') {
        tags.push({
          key: 'elevated',
          className: 'tag-elevated',
          icon: 'fa-shield-alt',
          label: this.$t('apps.tag_admin'),
          title: this.$t('_common.run_as'),
        });
      }

      if (this.app['auto-detach'] && this.app['auto-detach'] !== 'false') {
        tags.push({
          key: 'auto-detach',
          className: 'tag-detach',
          icon: 'fa-unlink',
          label: this.$t('apps.tag_auto_detach'),
          title: this.$t('apps.auto_detach'),
        });
      }

      return tags;
    },
    visibleTags() {
      return this.tagItems.slice(0, 2);
    },
    hiddenTagCount() {
      return Math.max(0, this.tagItems.length - this.visibleTags.length);
    },
    hiddenTags() {
      return this.tagItems.slice(this.visibleTags.length);
    },
    tagSummaryTitle() {
      return this.tagItems.map(tag => tag.title).join(' / ');
    },
    hasTags() {
      return this.tagItems.length > 0;
    }
  },
  methods: {
    handleImageError() { this.imageFailed = true },
    getImageUrl() { return getImagePreviewUrl(this.app['image-path']) },
  },
}
</script>
