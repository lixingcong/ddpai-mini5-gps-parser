<template>
    <div :class="titleStyle" @click="hidden = !hidden">{{ props.title }}</div>
    <div :class="contentStyle">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

interface Props {
    title: string
    hidden: boolean
}

const props = defineProps<Props>()
const hidden = ref(props.hidden)
const darkMode = ref(false)

onMounted(() => {
    darkMode.value = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        darkMode.value = event.matches
    });
})

const titleStyle = computed(() => ({
    'title-shown': !hidden.value,
    'title-hidden': hidden.value,
    'title-light': !darkMode.value,
    'title-dark': darkMode.value
}))

const contentStyle = computed(() => ({
    'content-shown': !hidden.value,
    'content-hidden': hidden.value
}))

</script>

<style scoped>
.content-shown {
    padding: 0.3em;
    border-radius: 0 0 0.5em 0.5em;
    border-width: 1px;
    border-style: solid;
    border-top-style: none;
}

.content-hidden {
    max-height: 0;
    overflow: hidden;
}

.title-shown {
    padding: 0.3em;
    margin-top: 0.5em;
    border-radius: 0.5em 0.5em 0 0;
}

.title-hidden {
    padding: 0.3em;
    margin-top: 0.5em;
    border-radius: 0.5em 0.5em 0.5em 0.5em;
}

.title-light {
    background-image: linear-gradient(to right, #e37575 0%, #eae3ba 100%, #c3c01a 100%, #7099ea 100%);
    color: black;
    border-color: gray;
}

.title-dark {
    background-image: linear-gradient(to right, #0c3483 0%, #a2b6df 100%, #6b8cce 100%, #a2b6df 100%);
    color: white;
    border-color: white;
}
</style>