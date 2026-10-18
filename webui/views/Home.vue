<template><div /></template>
<script setup>
import { onMounted } from 'vue'
onMounted(() => location.replace('/welcome' + location.search))
</script>
<style>@import '../styles/global.less';</style>
