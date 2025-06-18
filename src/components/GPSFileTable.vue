<template>
    <table>
        <thead>
            <tr>
                <th>
                    日期
                    <HelpTip text="点击超链接，可快速勾选该行所有记录"></HelpTip>
                </th>

                <th>
                    <a href="javascript:void(0)" @click="onClickedCopyUrls(undefined)">时间URL</a>
                    <HelpTip text="点击超链接，可以导出下载git/gpx原始文件地址。单击标题栏，则导出已勾选的多行。单击某行，则只导出该行。"></HelpTip>
                </th>

                <th>时长</th>

                <th>
                    <a href="javascript:void(0)" @click="onClickedSelectAll">全选</a>
                    <HelpTip text="点击超链接，可快速勾选该行所有记录"></HelpTip>
                </th>
            </tr>
        </thead>

        <tbody>
            <template v-for="(row,rowIdx) in rows">
                <tr>
                    <template v-if="row.date && row.weekDay">
                        <td :rowspan="row.includeRowIdxes!.length">
                            <a href="javascript:void(0)" @click="onClickedCopyUrls(row.includeRowIdxes!)">{{ row.date }}</a>
                            <br/>{{ row.weekDay }}
                        </td>
                    </template>

                    <td>
                        <a href="javascript:void(0)" @click="onClickedCopyUrls([rowIdx])">
                            {{ row.tsFromStr }}<template v-if="!row.sameDay"><br/></template><template v-else>到</template>{{ row.tsToStr }}
                        </a>
                    </td>

                    <td>
                        {{ row.duration }}
                    </td>

                    <td>
                        <label><input type="checkbox" v-model="selectedRowIdxes[rowIdx]" />选择 </label>
                        <button @click="selectRowOnly(rowIdx)">单选</button>
                    </td>
                </tr>
            </template>
        </tbody>
    </table>
</template>

<script setup lang="ts" name="GPSFileTable">
import { computed, reactive, toRefs, watch } from 'vue'
import { type GPSFileGroup } from '@/types/GPSFileTable'
import * as DDPAI_I from '@/ddpai/types/ddpai'
import HelpTip from './HelpTip.vue'
import * as DF from '@/ddpai/date-format'
import * as UTILS from '@/ddpai/utils'
import useClipboard from 'vue-clipboard3'

const props = defineProps<{
    groups:GPSFileGroup[],
    gpsFiles: DDPAI_I.GPSFile[],
    serverHostUrl: string
}>()

const emit = defineEmits<{
  (e: 'selectedGpsFileIdxes', urls: number[]): void
}>()

const {groups, gpsFiles, serverHostUrl} = toRefs(props)
const HtmlTableFormat = 'MM-DD HH:mm'; // HTML网页中的日期格式
const selectedRowIdxes:boolean[]=reactive([])
const { toClipboard } = useClipboard()

interface Row {
    includeRowIdxes?:number[] // 表格第1列 包含的行号
    date?: string // 表格第1列
    weekDay?: string // 表格第1列

    sameDay: boolean // 表格第2列
    tsFromStr: string // 表格第2列
    tsToStr: string // 表格第2列
    urls: string[] // 表格第2列

    duration: string // 表格第3列

    gpsFileArrayIdx: number // 用于传递给父亲组件的，选中的gpsFile下标
}

const rows=computed(():Row[] => {
    let ret:Row[] = []
    let rowOffset = 0

    groups.value.forEach(group => {
        group.gpsFileArrayIdxes.forEach((gpsFileArrayIdx, groupIdx) => {
            const gpsFile = gpsFiles.value[gpsFileArrayIdx]
            const t1 = gpsFile.from
            const t2 = gpsFile.to
            const [t1Str, t2Str, sameDay] = HtmlTableTimestampToString(t1, t2)

            let row:Row={
                sameDay: sameDay,
                tsFromStr: t1Str,
                tsToStr: t2Str,
                urls: gpsFile.filename.map(s => serverHostUrl.value+s ),
                duration:UTILS.secondToHumanReadableString(t2 - t1),
                gpsFileArrayIdx: gpsFileArrayIdx
            }

            if(0===groupIdx){
                row.includeRowIdxes = group.gpsFileArrayIdxes.map((_,idx) => idx + rowOffset) // 整日
                row.date = group.name
                row.weekDay=DF.timestampToString(t1, 'dd', false)
            }

            ret.push(row)
        })

        rowOffset += group.gpsFileArrayIdxes.length
    })

    //console.log('rows data:', ret)
    return ret
})

watch(rows, (newRows)=>{
    selectedRowIdxes.length=0
    for(let i =0;i<newRows.length;++i)
        selectedRowIdxes.push(false)
    //console.log('selectedRowIdxes=',selectedRowIdxes)
})

watch(selectedRowIdxes, (newSelectedRowIdxes) => {
    //console.log('newSelectedRowIdxes=',newSelectedRowIdxes)

    let idxes:number[] = []
    newSelectedRowIdxes.forEach((selected,rowIdx) => {
        if(selected)
            idxes.push(rows.value[rowIdx].gpsFileArrayIdx)
    })

    // 发送给父亲组件，告诉它哪些URL需要下载
    emit('selectedGpsFileIdxes', idxes)
})

function onClickedSelectAll()
{
    let allTrue = true
    for(let i=0;i<selectedRowIdxes.length;++i){
        if(!selectedRowIdxes[i]){
            allTrue = false
            break
        }
    }

    // toggle them
    for(let i=0;i<selectedRowIdxes.length;++i)
        selectedRowIdxes[i]=!allTrue
}

function onClickedCopyUrls(rowIdxes:number[]|undefined)
{
    let idxes:number[] = []

    if(undefined!==rowIdxes){
        // 固定某行
        idxes = rowIdxes
    }else{
        // 取出已选
        for(let r=0;r<selectedRowIdxes.length;++r){
            if(selectedRowIdxes[r])
                idxes.push(r)
        }
    }

    let urls:string[] = []
    idxes.forEach(rowIdx => {
        urls = urls.concat(rows.value[rowIdx].urls)
    })

    if(urls.length){
        const hint = '已经拷贝' + urls.length + '条URL到剪贴板！'
        copyToClipboard(urls.join('\n'), hint)
    }
}

// 返回 [起始字符 结束字符 是否同一天]
function HtmlTableTimestampToString(a:number, b:number):[string, string, boolean] {
	const from = DF.timestampToString(a, HtmlTableFormat, false)
	const to = DF.timestampToString(b, HtmlTableFormat, false)
	if(from.substring(0,5) == to.substring(0,5)) // same date
		return [from.substring(6), to.substring(6), true]
	return [from, to, false]
}

function selectRowOnly(row:number){
    for(let i=0;i<selectedRowIdxes.length;++i)
        selectedRowIdxes[i] = (row===i)
}

function copyToClipboard(s:string, hint?:string){
    toClipboard(s).then(()=>{
        if(hint)
            alert(hint)
    })
}

</script>

<style scoped>
th, td {
	border: 1px solid black;
}

table {
	width:100%;
}

td {
    padding-left: 0.2em;
	padding-right: 0.2em;
}

@media (prefers-color-scheme: dark) {
    th, td {
        border: 1px solid var(--text-color);
    }
}

</style>