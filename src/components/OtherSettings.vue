<template>
    <div class="btn-container">
        <span class="btn-spacer">
            <button @click="syncTime">同步时间</button>
        </span>
    </div>
</template>

<script setup lang="ts">

const syncTime = () => {
    console.log('clicked')
}

</script>

<style scoped>

</style>