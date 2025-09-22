<template>
  <Collapsible :title="'记录仪轨迹下载'" :hidden="false">
    <Downloader></Downloader>
  </Collapsible>

  <Collapsible :title="'轨迹文件转换'" :hidden="true">
    <Converter></Converter>
  </Collapsible>

  <Collapsible :title="'其它控制'" :hidden="true">
    <OtherSettings></OtherSettings>
  </Collapsible>

  <Collapsible :title="'关于'" :hidden="true">
    <About url="https://github.com/lixingcong/ddpai-mini5-gps-parser"></About>
  </Collapsible>
</template>

<script setup lang="ts">
import Converter from './components/Converter.vue'
import Downloader from './components/Downloader.vue'
import About from './components/About.vue'
import Collapsible from './components/Collapsible.vue'
import OtherSettings from './components/OtherSettings.vue'
import "@/views/style.css"
</script>

<style scoped>
</style>
