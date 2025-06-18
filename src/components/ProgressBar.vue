<template>
    <div v-show="rawValue > -1.5">
        <label>处理进度 </label>
        <progress ref="progressBar" value="-1"></progress>
    </div>
</template>

<script setup lang="ts" name="ProgressBar">
import { ref, toRef, watch } from 'vue'

interface Prop{
    progress:number
}

const props = defineProps<Prop>()
let rawValue = toRef(props,'progress')
let progressBar = ref()

// value=-1: indeterminate 无限滚动
// value=[0,1): determinate 表示0到1的进度
// -2: hide 隐藏
watch(rawValue, (value: number) => {
    const pb = progressBar.value as HTMLProgressElement
    if (rawValue.value >= 0 && rawValue.value <= 1)
        pb.value = value
    else if(value == -1)
        pb.removeAttribute('value')
})

</script>

<style scoped>

</style>