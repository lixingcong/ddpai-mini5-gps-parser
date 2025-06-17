<template>
    <div :class="hideContent ? 'card-title-hidden' : 'card-title'" @click="hideContent = !hideContent">轨迹文件转换</div>
    <div :class="hideContent ? 'card-content-hidden' : 'card-content'">
        <div>
            <input type="file" ref="fileInput" name="files[]" multiple accept=".kml,.gpx" />
        </div>

        <div>
            <select v-model="fileFormatSelected">
                <option v-for="option in fileFormatOptions" :value="option.value">
                    {{ option.text }}
                </option>
            </select>

            <span class="btn-spacer">
                <button @click="onClickedConvert">执行转换</button>
            </span>
            <HelpTip text="仅支持本站导出的轨迹文件格式之间相互转换，不保证兼容其它工具"></HelpTip>
        </div>

        <details>
            <summary>其它参数</summary>
            <div class="btn-container">
                <label><input type="checkbox" v-model="beautifyExport"></input>美化缩进</label>
                <HelpTip text="缩进：插入空白进行缩进对齐，牺牲文件尺寸，改善XML文件的可读性"></HelpTip>
                <label><input type="checkbox" v-model="convertSameFormat"></input>若格式相同也转换</label>
                <HelpTip text="若输入文件格式与输出一致，如kml转kml，也进行强制转换。若不设置强制转换，则对源文件不做任何修改"></HelpTip>
            </div>
            <div class="btn-container">
                <label>小地图长度</label>
                <input type="number" v-model="canvasWidth" min="40" max="1600" style="max-width: 5em;" />
                <label>高度</label>
                <input type="number" v-model="canvasHeight" min="40" max="1600" style="max-width: 5em;" />
            </div>
            <div class="btn-container">
                <label><input type="checkbox" v-model="trackFileHookCodeEnabled"></input>对TrackFile进行后处理</label>
                <HelpTip text="构建TrackFile对象，对轨迹进行后处理，如将路径坐标偏移，或者移除高度信息，需要对本项目源码熟悉"></HelpTip>
                <a target="_blank"
                    href="https://github.com/lixingcong/ddpai-mini5-gps-parser/blob/master/src/ddpai/tests/trackfile-hook-sample.js">参考源码</a>
            </div>
            <textarea v-model="trackFileHookCode" v-show="trackFileHookCodeEnabled" rows="12" cols="0"></textarea>
        </details>

        <ProgressBar :progress="fileProgress"></ProgressBar>
		<div>
            <div v-for="dl in trackDownloadLinks" class="btn-spacer">
                <a :text="dl.text" :download="dl.text" :href="dl.href"></a>,{{ dl.sizeHint }}
            </div>
            <div v-show="showPreviewZipButton">
                <button @click="listAllFiles">预览压缩包</button>
            </div>
        </div>
        <div v-for="p in trackPreviewProps">
            <TrackPreview
                :paintResult="p.paintResult"
                :canvasWidth="p.canvasWidth"
                :canvasHeight="p.canvasHeight"
                :addToClass="p.addToClass"
				:convert="p.convert"
				:download="p.download"
                :downloadLink="p.downloadLink">
            </TrackPreview>
        </div>
		<div v-show="infoList.show">
            源数目: {{ g_fileCount }}, 已转换: {{ infoList.converted }}, 无需转换: {{ infoList.same }}<br/>
            耗时{{ convertedCostTime }}
        </div>
		<div v-show="g_errorList.length>0">
			<div>错误信息（{{g_errorList.length}}条）</div>
			<div v-for="(e,idx) in g_errorList" class="error">{{ idx+1 }}: {{ e }}</div>
		</div>
        <component is="script" ref="scriptLoader" v-if="renderComponent"></component>
    </div>
</template>

<script setup lang="ts" name="Converter">
import HelpTip from "./HelpTip.vue"
import TrackPreview from './TrackPreview.vue'
import {type TrackPreviewProps, type ConvertProps }  from '../types/TrackPreview'
import { nextTick, reactive, ref, watch } from "vue"
import { type Converted, MyFile } from "@/converter"
import * as DF from '@/ddpai/date-format'
import * as TRACK from '@/ddpai/track'
import * as KML from '@/ddpai/kml'
import * as GPX from '@/ddpai/gpx'
import * as UTILS from '@/ddpai/utils'
import JSZip from 'jszip'
import ProgressBar from "./ProgressBar.vue"

let trackFileHookCode_ = `// 函数名字是固定值
window.trackFileHook = function(trackFile){
 const offset = wp => {
   const X = 0.1;
   wp.lat += X;
   wp.lon += X;
   if (wp.altitude) wp.altitude += X;
 }

 // TrackFile的定义，参考src/ddpai/track.ts的构造函数
 trackFile.points.forEach(point => { offset(point.wayPoint); });
 trackFile.lines.forEach(path => { path.wayPoints.forEach(offset); });
 trackFile.tracks.forEach(path => { path.wayPoints.forEach(offset); });

 // 若返回多个TrackFile对象，则分拆轨迹成多文件
 return [trackFile];
}
`

let hideContent = ref(true)
let trackFileHookCode = ref(trackFileHookCode_)
let trackFileHookCodeEnabled = ref(false)
let canvasWidth=ref(100)
let canvasHeight=ref(70)
let beautifyExport=ref(false)
let convertSameFormat=ref(false)
let fileInput = ref()
let scriptLoader = ref()
let renderComponent = ref(true)
let fileProgress = ref(-2)
let infoList = reactive({
    converted : 0,
    same: 0,
    show: false
})
let convertedCostTime = ref('')
let showPreviewZipButton = ref(false)
let trackPreviewProps:TrackPreviewProps[] = reactive([])

// 来自js版的变量
let g_errorList:string[] = reactive([])
let g_fileCount = ref(0)
let g_files:MyFile[] = []; // MyFile对象

const fileFormatSelected=ref('kml')
const fileFormatOptions = [
  { text: '转为KML', value: 'kml' },
  { text: '转为GPX', value: 'gpx' },
]

interface TrackDownload
{
    text:string
    href:string
    sizeHint: string
}
let trackDownloadLinks:TrackDownload[] = reactive([])

async function onClickedConvert()
{
    // console.log(text)

    const srcFiles = (fileInput.value as HTMLInputElement).files;
    if(!srcFiles || srcFiles.length < 1){
        appendError('请至少上传一个文件')
        return;
    }

    if(trackFileHookCodeEnabled.value){
        (window as any).trackFileHook = undefined

        // 强制刷新 https://medium.com/emblatech/ways-to-force-vue-to-re-render-a-component-df866fbacf47
        renderComponent.value = false
        await nextTick()

        renderComponent.value = true
        await nextTick()

        let scriptDOM = scriptLoader.value as HTMLScriptElement
        scriptDOM.text = trackFileHookCode.value

        const waitHookToBeReady = async () => {
            // https://stackoverflow.com/a/53269990/5271632
            const t1 = Date.now();
            while (undefined == (window as any).trackFileHook) {
                if(Date.now() - t1 > 500)
                    return;
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        };

        waitHookToBeReady().then(()=>{
            let f = (window as any).trackFileHook
            if(f){
                // console.log('hook is loaded')
                beginToExport(srcFiles)
            }else{
                appendError('无效的hook，请检查语法')
            }
        })
    }else{
        // no hook
        beginToExport(srcFiles)
    }
}

function beginToExport(srcFiles:FileList){
    const costTimestampBegin = DF.now();

    g_fileCount.value = srcFiles.length
    g_files=[]
    fileProgress.value = 0
    trackDownloadLinks.length = 0
    trackPreviewProps.length = 0
    showPreviewZipButton.value = false
    clearInfos()
    clearErrors()

    // do work now!
    let promises:PromiseLike<any>[] = [];
    for(let i =0; i<g_fileCount.value; ++i){
        const f = srcFiles[i];

        promises.push(promiseReadFile(f).then(myFile => {
            return promiseConvertFormat(myFile, fileFormatSelected.value).then(myFile => {
                g_files.push(myFile);
                fileProgress.value = g_files.length / g_fileCount.value
            })
        }));
    }

    Promise.allSettled(promises).then(function (results) {
        infoList.show = true

		results.forEach(r => {
			if (r.status === 'rejected') {
				appendError(r.reason);
			}
		});

        g_files = g_files.filter(myFile => { return myFile && myFile.converted.length > 0; });
        g_files.sort((a, b) => a.name.localeCompare(b.name)); // 按文件名排序

        if(g_files.length > 0){
            const zipHint = '转换'+fileFormatSelected.value+'合辑_'+DF.timestampToString(costTimestampBegin / 1000, 'YYYYMMDD-HHmmss', false);
            const zip = new JSZip();
            const zipFolder = zip.folder(zipHint)!;

            g_files.forEach(myFile => {
                myFile.converted.forEach(c => { zipFolder.file(c.name, c.content!); });

                if (myFile.keepSameFormat)
                    ++infoList.same;
                else
                    ++infoList.converted;
            });

            zip.generateAsync({
                compression: "DEFLATE",
                compressionOptions : {level:6},
                type: "blob",
                platform: "DOS",
                mimeType: 'application/zip'
            }).then((zipBlob) => {
                // done
                // TODO: 采用DownloadLink组件
                const dl:TrackDownload = {
                    text:zipHint+'.zip',
                    href:URL.createObjectURL(zipBlob),
                    sizeHint:UTILS.byteToHumanReadableSize(zipBlob.size)
                }
                trackDownloadLinks.push(dl)

                fileProgress.value=1;
                showPreviewZipButton.value = true
                convertedCostTime.value = UTILS.millisecondToHumanReadableString(DF.now() - costTimestampBegin)
            })
        } else {
            appendError('Zip文件内容为空')
            fileProgress.value=1;
            convertedCostTime.value = UTILS.millisecondToHumanReadableString(DF.now() - costTimestampBegin)
        }
	});
}

function appendError(s:string) {
    g_errorList.push(s)
}

function clearErrors() {
    g_errorList.length=0
}

function clearInfos(){
    infoList.show = false
    infoList.converted = infoList.same = 0
}

function listAllFiles(){
    showPreviewZipButton.value = false
    g_files.forEach((myFile) => {
        myFile.converted.forEach(c => {
            const trackFile = c.trackFile!;
            const paths = trackFile.lines.concat(trackFile.tracks);

            const props:TrackPreviewProps ={
                paintResult:TRACK.paint(paths, canvasWidth.value, canvasHeight.value)!,
                canvasWidth:canvasWidth.value,
                canvasHeight:canvasHeight.value,
                addToClass: false,
                convert:{
                    keepSameFormat:myFile.keepSameFormat,
                    trackPointCount:trackFile.points.length,
                    trackLineCount:trackFile.lines.length,
                    trackPathCount:trackFile.tracks.length
                },
                downloadLink:{
                    filename:c.name,
                    blob:new Blob([c.content!]),
                }
            }

            trackPreviewProps.push(props)
        });
    });
}

// ---- promise 1 ----
type ReadFileResolve = (myFile:MyFile) => void
const promiseReadFile = (file:File) => new Promise(function (resolve:ReadFileResolve, reject) {
    // API: resolve(MyFile)
    const reader = new FileReader();
    reader.onload = () => {
        let f = new MyFile(file.name);
        f.content = reader.result as string;
        resolve(f);
    };
    reader.onerror = reject;
    reader.onabort = reject;
    reader.readAsText(file);
});

type ConvertFormatResolve = (myFile:MyFile) => void
const promiseConvertFormat = (myFile:MyFile, destFormat:string) => new Promise(function(resolve:ConvertFormatResolve, reject) {
    // API: resolve(MyFile)
    const SrcName = myFile.name;
    const SrcPrefixSuffix=myFile.parseName();

    if(undefined == SrcPrefixSuffix){
        reject(new Error('Invalid file extension: ' + SrcName));
        return;
    }

    const SrcPrefix = SrcPrefixSuffix[0];
    const SrcSuffix = SrcPrefixSuffix[1];

    type FormFile = (content:string) => TRACK.TrackFile|undefined
    let fromFile:FormFile;

    switch(SrcSuffix){
        case 'kml':
            fromFile = (c:string) => {
                const kmlDoc = KML.Document.fromFile(c)
                return kmlDoc ? TRACK.TrackFile.fromKMLDocument(kmlDoc) : undefined
            }
            break;
        case 'gpx':
            fromFile = (c:string) => {
                const gpxDoc = GPX.Document.fromFile(c)
                return gpxDoc ? TRACK.TrackFile.fromGPXDocument(gpxDoc) : undefined
            }
            break;
        default:
            reject(new Error('Unsupport file extension: ' + SrcSuffix + ' of ' + SrcName));
            return;
    }

    if(myFile.content)
        myFile.trackFile=fromFile(myFile.content);

    if(undefined==myFile.trackFile){
        reject(new Error('Failed to build TrackFile object: ' + SrcName));
        return;
    }

    // skip if has same format
    if(!convertSameFormat.value && SrcSuffix == destFormat){
        myFile.keepSameFormat = true;
        myFile.converted=[{name:myFile.name, content:myFile.content, trackFile:myFile.trackFile}];
        resolve(myFile);
        return; // No need for convert
    }

    let newTrackFiles:TRACK.TrackFile[] = []
    if(trackFileHookCodeEnabled.value && (window as any).trackFileHook){
        const jsConverted:any[] = (window as any).trackFileHook(myFile.trackFile);
        newTrackFiles=jsConverted.map(converted => {
            const t = new TRACK.TrackFile(undefined)
            Object.assign(t, converted) // 使用javascript转换的结果，需要手动合并各个属性，再扔回typescript处理
            return t
        })
    }else{
        newTrackFiles.push(myFile.trackFile) // 不使用hook
    }

    if(0 == newTrackFiles.length){
        reject(new Error('Removed by hook: ' + SrcName));
        return;
    }

    type ToFile = (t:TRACK.TrackFile) => string
    let toFile:ToFile;

    switch(destFormat){
        case 'kml':
            toFile = (t:TRACK.TrackFile) => t.toKMLDocument().toFile(beautifyExport.value);
            break;
        case 'gpx':
            toFile = (t:TRACK.TrackFile) => t.toGPXDocument().toFile(beautifyExport.value);
            break;
        default:
            reject(new Error('Unsupport dest format: ' + destFormat));
            return;
    }
    const NewContents = newTrackFiles.map(toFile);
    const NewContentLength = NewContents.length;
    const ZeroPadWidth = UTILS.intWidth(NewContentLength);

    type NewFileNameFunc = (idx:number) => string
    let newFileNameFunc:NewFileNameFunc
    if(1==NewContentLength)
        newFileNameFunc = idx => SrcPrefix+'.'+destFormat;
    else
        newFileNameFunc = idx => SrcPrefix + '_' + UTILS.zeroPad(idx+1, ZeroPadWidth) + '.' + destFormat;

    myFile.converted=NewContents.map((c,idx) => {
        return {name:newFileNameFunc(idx), content:c, trackFile:newTrackFiles[idx]}
    });

    resolve(myFile);
});

// ---- promise 2 ----

</script>

<style scoped>
textarea {
	width: 100%;
	font-size: 0.8em;
}
</style>