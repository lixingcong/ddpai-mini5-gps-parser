<template>
    <div class="btn-container">
        <div class="btn-spacer">
            <canvas ref="canvas"></canvas>
        </div>

        <div v-bind:class="{'btn-spacer': props.addToClass }">
            <DownloadLink v-if="props.downloadLink" :filename="props.downloadLink.filename" :blob="props.downloadLink.blob"></DownloadLink>

            <div v-if="props.convert">
                点位{{ props.convert.trackPointCount }}，路径{{ props.convert.trackLineCount }}，轨迹{{ props.convert.trackPathCount }}{{ convertedHint }}
            </div>

            <div v-if="props.convert">
                比例尺：{{ horizontalDistanceHint }}×{{ verticalDistanceHint }}
            </div>

            <div v-if="props.download">
                {{ downloadedHint }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="TrackPreview">
import { newCanvasDiv } from '@/canvasdraw'
import { computed, onMounted, ref, toRef, watch, watchEffect } from 'vue'
import { type TrackPreviewProps } from '@/types/TrackPreview'
import * as UTILS from '@/ddpai/utils'
import DownloadLink from './DownloadLink.vue'
import { toRad } from 'pureimage/dist/point'

let canvas = ref()

const props = defineProps<TrackPreviewProps>()

const canvasWidth = toRef(props, 'canvasWidth')
const canvasHeight = toRef(props, 'canvasHeight')

const horizontalDistanceHint = computed(() => UTILS.meterToString(props.paintResult.horizontalDistance))
const verticalDistanceHint = computed(() => UTILS.meterToString(props.paintResult.verticalDistance))

const convertedHint = computed(():string => {
    if(props.convert)
        return props.convert.keepSameFormat ? '' : '，已转换'
    return ''
})

const downloadedHint = computed(():string => {
    const d = props.download
    if(d){
        let t = d.prefix
        if(d.duration > 0){
            t += '耗时' + UTILS.secondToHumanReadableString(d.duration)
            t += '，直线' + UTILS.meterToString(d.lineDistance)
            if (d.realDistance > 0)
                t += '，里程' + UTILS.meterToString(d.realDistance)
        }
        return t
    }
    return ''
})

const repaint = () =>{
    const c = canvas.value as HTMLCanvasElement
    if(c)
        newCanvasDiv(c, props.paintResult.points, true, canvasWidth.value, canvasHeight.value)
}

onMounted(()=>{
    repaint()
})

watchEffect(repaint)

</script>

<style scoped>
canvas {
	background: #c9cfcf;
	border: 1px solid black;
}
</style>