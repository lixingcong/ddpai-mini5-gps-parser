<template>
    <div class="btn-container">
        <div class="btn-spacer">
            <canvas ref="canvas"></canvas>
        </div>

        <div class="btn-spacer">
            <a :text="props.filename" :download="props.filename" :href="downloadHref"></a>, {{ fileSizeHint }}
            <div>点位{{ props.trackPointCount }}，路径{{ props.trackLineCount }}，轨迹{{ props.trackPathCount }}{{ convertedHint
                }}</div>
            <div>比例尺：{{ horizontalDistanceHint }}×{{ verticalDistanceHint }}</div>
        </div>
    </div>
</template>

<script setup lang="ts" name="TrackPreview">
import { newCanvasDiv } from '@/canvasdraw';
import { nextTick, ref } from 'vue';
import { type Props } from '@/types/TrackPreview';
import * as UTILS from '@/ddpai/utils'

let canvas = ref()

const props = defineProps<Props>()
const downloadHref = URL.createObjectURL(props.fileBlob)
const fileSizeHint = UTILS.byteToHumanReadableSize(props.fileBlob.size)
const convertedHint = props.keepSameFormat ? '' : '，已转换'
const horizontalDistanceHint = UTILS.meterToString(props.paintResult.horizontalDistance)
const verticalDistanceHint = UTILS.meterToString(props.paintResult.verticalDistance)

setTimeout(async () => {
    await nextTick() // To make sure DOM has been initialized
    const c = canvas.value as HTMLCanvasElement
    if (c)
        newCanvasDiv(c, props.paintResult.points, true, props.canvasWidth, props.canvasHeight)
}, 1)

</script>

<style scoped></style>