<template>
    <a :text="filename" :download="filename" :href="downloadHref"></a>{{ fileSizeHint }}
</template>

<script setup lang="ts" name="DownloadLink">
import { type DownloadLinkProps } from '@/types/DownloadLink';
import * as UTILS from '@/ddpai/utils'
import { computed, toRef } from 'vue';

const props = defineProps<DownloadLinkProps>()
const rawFilename = toRef(props, 'filename')
const rawBlob = toRef(props, 'blob')

const filename = computed(() => rawFilename.value ? rawFilename.value : '点击下载')
const downloadHref = computed(() => rawBlob.value ? URL.createObjectURL(rawBlob.value) : 'javascript:void(0);')
const fileSizeHint = computed(() => rawBlob.value ? (','+UTILS.byteToHumanReadableSize(rawBlob.value.size)) : '')

</script>
