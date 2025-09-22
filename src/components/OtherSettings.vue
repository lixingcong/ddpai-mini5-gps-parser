<template>
    <div class="btn-container">
        <span class="btn-spacer">
            <button @click="syncTime">同步时间</button>
        </span>
    </div>
</template>

<script setup lang="ts">

const serverHostUrl = import.meta.env.VITE_DDPAI_SERVER_HOST as string;
const urlAPIGpsFileListReq = serverHostUrl + import.meta.env.VITE_DDPAI_APIGpsFileListReq

const syncTime = () => {
    console.log('clicked')
}

</script>

<style scoped>

</style>