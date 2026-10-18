<template><div /></template>
<script setup>
import { onMounted } from 'vue'
onMounted(() => location.replace(location.hash === '#logout' ? '/config#logout' : '/config#account'))
</script>
