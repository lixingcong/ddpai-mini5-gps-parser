<template>
    <div :class="hideContent ? 'card-title-hidden' : 'card-title'" @click="hideContent = !hideContent">关于</div>
    <div :class="hideContent ? 'card-content-hidden' : 'card-content'">
        <div>
            版本<span class="btn-spacer"><a target="_blank" :href="props.url">{{ commit }}</a> {{ commitDate }}</span>
        </div>
        <div>
            相关链接
            <template v-for="w in otherWebsites">
                <span class="btn-spacer"><a target="_blank" :href="w.value">{{ w.text }}</a></span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts" name="About">
import {type GitCommitInfo} from '@/types/GitCommitInfo'
import { ref } from 'vue'

const props = defineProps<{url:string}>()

let hideContent = ref(true)
const [commit, commitDate] = version()

const otherWebsites = [
    {text:'CORS扩展', value:'https://mybrowseraddon.com/access-control-allow-origin.html'},
    {text:'Google Earth', value:'https://earth.google.com/web'}
]

// 返回 [gitCommit, 提交日期]
function version():[string,string] {
    if(!import.meta.env.PROD)
        return ['dev', '']

    const g = _GIT_COMMIT_INFO as GitCommitInfo
    const date = new Date(g.commitTimestamp)

    // 年月日
    const Y = date.getFullYear()
    const M = "0" + (1 + date.getMonth())
    const D = "0" + date.getDate()
    var formattedTime = Y + M.substring(M.length - 2) + D.substring(D.length - 2)

    return [g.shortSHA, formattedTime]
}

</script>

<style scoped>

</style>