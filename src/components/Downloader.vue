<template>
    <div :class="hideContent ? 'card-title-hidden' : 'card-title'" @click="hideContent = !hideContent">记录仪轨迹下载</div>
    <div :class="hideContent ? 'card-content-hidden' : 'card-content'">
        <div class="btn-container">
            <span class="btn-spacer">
                <button @click="getFromHttpServer">从记录仪获取</button>
            </span>
            <span class="btn-spacer">
                <input type="file" ref="fileInput" name="files[]" multiple accept=".gpx,.git" />
            </span>
        </div>

        <div v-show="gpsFileGroups.length > 0">
			<GPSFileTable @selectedGpsFileIdxes="setSelectedGpsFileIdxes" :groups="gpsFileGroups" :gpsFiles="g_gpsFileListReq" :serverHostUrl="serverHostUrl"></GPSFileTable>
		</div>

        <div class="btn-container">
            <span class="btn-spacer">
                <button @click="useHttpFiles">使用记录仪已选</button>
            </span>
            <span class="btn-spacer">
                <button @click="useLocalFiles">使用本地文件</button>
            </span>
        </div>

        <div class="btn-container">
            <select v-model="fileFormatSelected">
                <option v-for="option in fileFormatOptions" :value="option.value">
                    {{ option.text }}
                </option>
            </select>
            <span class="btn-spacer">
                <button @click="exportToTrack(true)">单文件</button>
            </span>
            <span class="btn-spacer">
                <button @click="exportToTrack(false)">多文件</button>
            </span>
        </div>

        <details>
            <summary>其它参数</summary>
            <div class="btn-container">
                <label><input type="checkbox" v-model="enableTrack"></input>导出轨迹</label>
                <HelpTip text="轨迹：带有时间戳信息，可推算出速度"></HelpTip>

                <label><input type="checkbox" v-model="enableLine"></input>导出路径</label>
                <HelpTip text="路径：不含时间戳"></HelpTip>
            </div>
            <div class="btn-container">
                <label><input type="checkbox" v-model="enableTwoPoint"></input>导出两点</label>
                <HelpTip text="两点：轨迹起始点和结束点"></HelpTip>

                <label><input type="checkbox" v-model="enableBeautify"></input>美化缩进</label>
                <HelpTip text="缩进：插入空白进行缩进对齐，牺牲文件尺寸，改善XML文件的可读性"></HelpTip>
            </div>
            <div class="btn-container">
                <span class="btn-spacer">
                    分割间隔时长阈值：<label>{{ thresholdSliderHint }}</label>
                    <HelpTip text="设定为不分割：所有时间段合并为单条轨迹。设定为某个时间：若两条轨迹的间隔时间小于设定值，将合并成同一个轨迹。（例：停车10分钟，若阈值5分钟则成合并成一条记录，若阈值为20分钟，则分割成两条记录）"></HelpTip>
                </span>
            </div>

            <div class="btn-container">
                <span class="btn-spacer">
                    <input type="range" v-model="thresholdSliderValue" :min="thresholdSliderRange[0]" :max="thresholdSliderRange[1]" />
                </span>
            </div>

            <div>
                <template v-for="w in otherWebsites">
                    <span class="btn-spacer"><a target="_blank" :href="w.value">{{ w.text }}</a></span>
                </template>
            </div>
        </details>

		<div v-show="zipDownloadProps.blob">
			<DownloadLink :filename="zipDownloadProps.filename" :blob="zipDownloadProps.blob"></DownloadLink>
		</div>

		<div v-show="singleFileDownloadProps.blob">
			<DownloadLink :filename="singleFileDownloadProps.filename" :blob="singleFileDownloadProps.blob"></DownloadLink>
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
        <ProgressBar :progress="fileProgress"></ProgressBar>
        <div ref="infoList"></div>
		<div v-show="errorList.length>0">
			<div>错误信息（{{errorList.length}}条）</div>
			<div v-for="(e,idx) in errorList" class="error">{{ idx+1 }}: {{ e }}</div>
		</div>
    </div>
</template>

<script setup lang="ts" name="Downloader">
import { computed, reactive, ref, nextTick } from 'vue'
import { parseTar } from 'tarparser';
import HelpTip from './HelpTip.vue'
import GPSFileTable from './GPSFileTable.vue';
import * as UTILS from '@/ddpai/utils'
import * as DF from '@/ddpai/date-format'
import * as TRACK from '@/ddpai/track'
import * as TRACK_I from '@/ddpai/types/track'
import * as WP from '@/ddpai/waypoint'
import { type WayPointIntf } from "@/ddpai/types/waypoint";
import * as KML from '@/ddpai/kml'
import * as GPX from '@/ddpai/gpx'
import * as DDPAI from '@/ddpai/ddpai'
import * as DDPAI_I from '@/ddpai/types/ddpai'
import * as RD from '@/RequestDecorator'
import ProgressBar from './ProgressBar.vue'
import TrackPreview from './TrackPreview.vue'
import DownloadLink from './DownloadLink.vue'
import {type TrackPreviewProps }  from '../types/TrackPreview'
import {type DownloadLinkProps }  from '../types/DownloadLink'
import { type GPSFileGroup } from '@/types/GPSFileTable';
import JSZip from 'jszip'

let hideContent = ref(false)
let enableTrack = ref(true)
let enableLine = ref(false)
let enableTwoPoint = ref(true)
let enableBeautify = ref(false)
let thresholdSliderValue = ref(230)
let fileInput = ref()
let errorList:string[] = reactive([])
let fileProgress = ref(-2)
let infoList = ref()
let trackPreviewProps:TrackPreviewProps[] = reactive([])
const zipDownloadProps:DownloadLinkProps = reactive({})
const singleFileDownloadProps:DownloadLinkProps = reactive({})
const gpsFileGroups:GPSFileGroup[] = reactive([])
let selectedGpsFileIdxes:number[] = [] // 待下载gpx/git文件的数组索引，对应g_gpsFileListReq数组下标

let g_gpxPreprocessContents:{ [key: string]: string[] } = {} // 字典，为json中的startTime到gpx原文件内容的映射（只保留GPGGA和GPRMC行）
let g_timestampToWayPoints:{[key: number]: WayPointIntf} = {} // 字典，为timestamp到WayPoint对象的映射
const g_gpsFileListReq:DDPAI_I.GPSFile[] = reactive([]) // 数组，HTTP链接，每个gpx/git的直链

const HtmlTableFormat = 'MM-DD HH:mm'; // HTML网页中的日期格式
const WayPointDescriptionFormat = 'YYYYMMDD HH:mm'; // 描述一个点的注释日期格式

const thresholdSliderRange=[0,1000]
const serverHostUrl = ref(import.meta.env.VITE_DDPAI_SERVER_HOST as string)
const urlAPIGpsFileListReq = serverHostUrl.value + import.meta.env.VITE_DDPAI_APIGpsFileListReq

const fileFormatSelected=ref('kml')
const fileFormatOptions = [
    { text: '导出KML', value: 'kml' },
    { text: '导出GPX', value: 'gpx' }
]
const otherWebsites = [
    {text:'源码', value:'https://github.com/lixingcong/ddpai-mini5-web-client'},
    {text:'CORS扩展', value:'https://mybrowseraddon.com/access-control-allow-origin.html'},
    {text:'Google Earth', value:'https://earth.google.com/web'}
]

const CanvasDefaultWidth = 64
const CanvasDefaultHeight = 42

function isMobileUserAgent():boolean {
	return /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isFilenameGpxGit(filename:string):boolean {
	return filename.search(/\d{14}_\d{4}(_D|_T)?\.g(px|it)/i) >= 0;
}

function fileNameTsFromTo(a:number, b:number):string {
	const TrackFileNameFormat = 'YYYYMMDD-HHmm'; // 文件名日期格式，不能含特殊字符，如冒号
	const from = DF.timestampToString(a, TrackFileNameFormat, false);
	const to = DF.timestampToString(b, TrackFileNameFormat, false);
	if(from.substring(0,8) == to.substring(0,8)) // same date
		return from + '到' + to.substring(9);
	return from + '到' + to;
}

function descriptionTsFromTo(a:number, b:number):string {
	const from = DF.timestampToString(a, WayPointDescriptionFormat, false);
	const to = DF.timestampToString(b, WayPointDescriptionFormat, false);
	if(from.substring(0,8) == to.substring(0,8)) // same date
		return from + '~' + to.substring(9);
	return from + '~' + to;
}

function simpleTimestampToString(a:number, b:number):string {
	const from = DF.timestampToString(a, HtmlTableFormat, false);
	const to = DF.timestampToString(b, HtmlTableFormat, false);
	if(from.substring(0,5) == to.substring(0,5)) // same date
		return from + '~' + to.substring(6);
	return from + '~' + to;
}

async function getFromHttpServer(){
	clearDownloads()
	clearErrors()
	g_gpsFileListReq.length = 0
	gpsFileGroups.length = 0
	await nextTick()

	promiseHttpGetAjax(urlAPIGpsFileListReq, true).then(response => {
		const newGpsFileListReq = DDPAI.API_GpsFileListReqToArray(response as string)
		Object.assign(g_gpsFileListReq, newGpsFileListReq)

		if (g_gpsFileListReq.length > 0) {
			const groupGpsFileListReq = () => {
				let grouped:{[key:string]: number[]} = {};
				g_gpsFileListReq.forEach((gpsFile, idx) => {
					let fromDateStr = DF.timestampToString(gpsFile.from, 'MM-DD', false);
					if (!(fromDateStr in grouped))
						grouped[fromDateStr] = [];
					grouped[fromDateStr].push(idx);
				});
				return grouped;
			}

			const grouped = groupGpsFileListReq();
			const groupedKeys = Object.keys(grouped).sort((a, b) => { return a.localeCompare(b); }); // oldest date first

			groupedKeys.forEach(k => {
				const sortedIdxes = grouped[k].sort((a, b) => {
					const ta = g_gpsFileListReq[a].from;
					const tb = g_gpsFileListReq[b].from;
					return ta - tb; // oldest date first
				});

				gpsFileGroups.push({
					name: k,
					gpsFileArrayIdxes: sortedIdxes
				})
			})
		}
	}, rejectedReason => {
		appendError(rejectedReason);
	});
}

function exportToTrack(singleFile:boolean){
    const costTimestampBegin = DF.now();
	const timestamps = Object.keys(g_timestampToWayPoints).map(Number).sort(); // 按时间排序

	clearDownloads()

	if (timestamps.length > 0) {
		// 按时间差分阈值分割完毕的结果
		let timestampsGrouped = UTILS.splitOrderedNumbersByThreshold(timestamps, thresholdSecond.value);

		const zip = new JSZip();

		const ExportFormat = fileFormatSelected.value
		const EnableTrack = enableTrack.value
		const EnableRoute = enableLine.value
		const EnablePoint = enableTwoPoint.value
		const EnableBeautify = enableBeautify.value

		const appendWayPointsToTrackFile = (trackFile:TRACK.TrackFile, wayPoints:WayPointIntf[], wayPointFrom:WayPointIntf, wayPointTo:WayPointIntf, distance:number, readableIdx:string|undefined) => {
			const DistanceStr = ' ' + UTILS.meterToString(distance);

			let pathSuffix = descriptionTsFromTo(wayPointFrom.timestamp!, wayPointTo.timestamp!) + DistanceStr;
			let startSuffix = DF.timestampToString(wayPointFrom.timestamp!, WayPointDescriptionFormat, false);
			let endSuffix = DF.timestampToString(wayPointTo.timestamp!, WayPointDescriptionFormat, false);

			if(undefined!=readableIdx){
				const Prefix = readableIdx + ': ';
				pathSuffix = Prefix + pathSuffix;
				startSuffix = Prefix + startSuffix;
				endSuffix = Prefix + endSuffix;
			}

			if(EnablePoint){
				trackFile.points.push(new TRACK.Point('Start ' + startSuffix, wayPointFrom, undefined));
				trackFile.points.push(new TRACK.Point('End ' + endSuffix, wayPointTo, undefined));
			}

			if(EnableRoute)
				trackFile.lines.push(new TRACK.Path('Route '+ pathSuffix, wayPoints, undefined));

			if(EnableTrack)
				trackFile.tracks.push(new TRACK.Path('Track '+pathSuffix, wayPoints, undefined));
		}

		const trackFileToContent = (trackFile:TRACK.TrackFile, fmt:string) => {
			if('kml' == fmt)
				return trackFile.toKMLDocument().toFile(EnableBeautify);
			if('gpx' == fmt)
				return trackFile.toGPXDocument().toFile(EnableBeautify);
			return undefined;
		}

		let g_tsFrom = Number.MAX_SAFE_INTEGER;
		let g_tsTo = Number.MIN_SAFE_INTEGER;

		if (singleFile) {
			// singleFile = true表示单个文件，内含N条轨迹

			const ZeroPadLength = UTILS.intWidth(timestampsGrouped.length);
			const trackFile = new TRACK.TrackFile(undefined);

			timestampsGrouped.forEach((timestamps, idx) => {
				const WayPoints = timestamps.map(ts => g_timestampToWayPoints[ts]);
				const WayDistance = WP.wayDistance(WayPoints);
				const WayPointFrom = WayPoints[0];
				const WayPointTo = WayPoints[WayPoints.length-1];
				const ReadableIdx = UTILS.zeroPad(idx + 1, ZeroPadLength); // 2 -> '00000000002'

				const HintPrefix = '轨迹' + ReadableIdx + '，' + simpleTimestampToString(WayPointFrom.timestamp!, WayPointTo.timestamp!)+ '，';

				const paths = [new TRACK.Path(undefined, WayPoints,undefined)];

				const props:TrackPreviewProps ={
					paintResult:TRACK.paint(paths, CanvasDefaultWidth, CanvasDefaultHeight)!,
					canvasWidth:CanvasDefaultWidth,
					canvasHeight:CanvasDefaultHeight,
					addToClass:true,
					download: {
						prefix: HintPrefix,
						duration:WayPointTo.timestamp!-WayPointFrom.timestamp!,
						lineDistance: WayPointFrom.distanceTo(WayPointTo),
						realDistance: WayDistance
					}
				}

				trackPreviewProps.push(props)

				appendWayPointsToTrackFile(trackFile, WayPoints, WayPointFrom, WayPointTo, WayDistance, ReadableIdx);

				if (g_tsFrom > WayPointFrom.timestamp!)
					g_tsFrom = WayPointFrom.timestamp as number;
				if (g_tsTo < WayPointTo.timestamp!)
					g_tsTo = WayPointTo.timestamp as number;
			});

			const Filename = fileNameTsFromTo(g_tsFrom, g_tsTo) + '共' + timestampsGrouped.length + '条.' + ExportFormat;
			trackFile.name = descriptionTsFromTo(g_tsFrom, g_tsTo) + '共' + timestampsGrouped.length + '条';
			const TrackContent = trackFileToContent(trackFile, ExportFormat)!;
			singleFileDownloadProps.blob = new Blob([TrackContent])
			singleFileDownloadProps.filename = Filename
			zip.file(Filename, TrackContent);
		} else {
			// singleFile = false表示每个文件只含1条轨迹
			timestampsGrouped.forEach(timestamps => {
				const WayPoints = timestamps.map(ts => g_timestampToWayPoints[ts]);
				const WayDistance = WP.wayDistance(WayPoints);
				const WayPointFrom = WayPoints[0];
				const WayPointTo = WayPoints[WayPoints.length-1];

				if (g_tsFrom > WayPointFrom.timestamp!)
					g_tsFrom = WayPointFrom.timestamp as number;
				if (g_tsTo < WayPointTo.timestamp!)
					g_tsTo = WayPointTo.timestamp as number;

				let trackFile = new TRACK.TrackFile(undefined);
				appendWayPointsToTrackFile(trackFile, WayPoints, WayPointFrom, WayPointTo, WayDistance, undefined)

				const TsFrom = WayPointFrom.timestamp!;
				const TsTo = WayPointTo.timestamp!;
				const Filename = fileNameTsFromTo(TsFrom, TsTo) + '.' + ExportFormat;
				const FileDesciption = descriptionTsFromTo(TsFrom, TsTo);
				trackFile.name = FileDesciption;
				const TrackContent = trackFileToContent(trackFile, ExportFormat)!;
				//divLink.append(TL.newHintDiv('', WayPointFrom, WayPointTo, WayDistance, false));

				const paths = trackFile.lines.concat(trackFile.tracks);

				const props:TrackPreviewProps ={
					paintResult:TRACK.paint(paths, CanvasDefaultWidth, CanvasDefaultHeight)!,
					canvasWidth:CanvasDefaultWidth,
					canvasHeight:CanvasDefaultHeight,
					addToClass:false,
					download:{
						prefix: '',
						duration:TsTo-TsFrom,
						lineDistance: WayPointFrom.distanceTo(WayPointTo),
						realDistance: WayDistance
					},
					downloadLink:{
						filename:Filename,
						blob:new Blob([TrackContent])
					}
				}

				trackPreviewProps.push(props)
				zip.file(Filename, TrackContent);
			});
		}

		// zip
		zip.generateAsync({
			compression: "DEFLATE",
			compressionOptions : {level:6},
			type: "blob",
			platform: "DOS",
			mimeType: 'application/zip'
		}).then((zipBlob) => {
			zipDownloadProps.filename='轨迹合辑_'+fileNameTsFromTo(g_tsFrom,g_tsTo)+'.zip'
			zipDownloadProps.blob = zipBlob
			infoList.value.innerHTML= ('导出轨迹完成，耗时 ' + UTILS.millisecondToHumanReadableString(DF.now() - costTimestampBegin));
		})
	} else {
		infoList.value.innerHTML= ('轨迹内容为空白，耗时 ' + UTILS.millisecondToHumanReadableString(DF.now() - costTimestampBegin));
	}
}

const thresholdSecond = computed((): number => {
	const ratio = UTILS.scaleToIndex(thresholdSliderValue.value, thresholdSliderRange[0], thresholdSliderRange[1], Math.E, 5); // [0,1]
	return Math.abs(Math.trunc(ratio * 86400));
});

const thresholdSliderHint = computed((): string => {
	if(thresholdSecond.value < 1)
        return '不分割'
    return UTILS.secondToHumanReadableString(thresholdSecond.value)
});

function refreshDownloadProgress(costTime:number = -1) {
	const finshedText = (costTime >= 0 ? '，已下载完毕（耗时' + UTILS.millisecondToHumanReadableString(costTime) + '）' : '');
	const pointTitle = (costTime >= 0 ? '原始点位数：' : '预处理：');
	const pointCount = (costTime >= 0 ? Object.keys(g_timestampToWayPoints).length : Object.keys(g_gpxPreprocessContents).length);
    infoList.value.innerHTML= pointTitle + pointCount + finshedText + '<br/>'
}

function useHttpFiles(){
    if(selectedGpsFileIdxes.length < 1){
        appendError('从记录仪获取后，请至少在表格中勾选一行')
        return;
    }

	const costTimestampBegin = DF.now();
	fileProgress.value = -1
	clearErrors();

	let promises:PromiseLike<any>[] = [];
	const httpGetDecorator = new RD.RequestDecorator(4, promiseHttpGetAjax)

	selectedGpsFileIdxes.forEach(gpsFileIdx => {
		const gpsFile = g_gpsFileListReq[gpsFileIdx]
		gpsFile.filename.forEach(filename => {
			const url = serverHostUrl.value + filename
			promises.push(httpGetDecorator.request(url, false).then(
				blob => parseGitAndGpxFromBlob(filename, blob)
			))
		})
	})

	Promise.allSettled(promises).then(function (results) {
		results.forEach(r => {
			if (r.status === 'rejected') {
				appendError(r.reason);
			}
		});

		mergePreprocessed();
		fileProgress.value = -2
		refreshDownloadProgress(DF.now() - costTimestampBegin);
	});
}

function useLocalFiles(){
	const srcFiles = (fileInput.value as HTMLInputElement).files;
    if(!srcFiles || srcFiles.length < 1){
        appendError('请至少上传一个文件')
        return;
    }

	const costTimestampBegin = DF.now();

	// 处理上传的文件
	fileProgress.value = -1
	let promises:PromiseLike<any>[] = [];
	for(let i =0; i<srcFiles.length; ++i){
		let f = srcFiles[i];
		let filename = f.name;
		if (isFilenameGpxGit(filename))
			promises.push(parseGitAndGpxFromBlob(filename, f))
		else
			promises.push(Promise.reject(new Error('Filename is invalid: ' + filename)))
	}

	Promise.allSettled(promises).then(results => {
		results.forEach(r => {
			if (r.status === 'rejected') {
				errorList.push(r.reason)
			}
		});

		mergePreprocessed();
		fileProgress.value = -2
		refreshDownloadProgress(DF.now() - costTimestampBegin);
	});
}

function mergePreprocessed(){
	// merge all preprocess gpx file content into a single dict
	let gpxPreprocessTimestamps = Object.keys(g_gpxPreprocessContents);
	gpxPreprocessTimestamps.sort();
	let concated:string[] = [];
	gpxPreprocessTimestamps.forEach(ts => { concated = concated.concat(g_gpxPreprocessContents[ts]); });
	g_timestampToWayPoints = DDPAI.gpxToWayPointDict(concated);
	g_gpxPreprocessContents = {}; // clean up
}

function appendError(s:string){
	errorList.push(s)
}

function clearErrors(){
	errorList.length = 0
}

function clearDownloads(){
	zipDownloadProps.blob = undefined
	singleFileDownloadProps.blob = undefined
	trackPreviewProps.length = 0
	infoList.value.innerHTML = ''
}

function setSelectedGpsFileIdxes(idxes: number[]){
	selectedGpsFileIdxes = idxes
	//console.log('setSelectedGpsFileIdxes', selectedGpsFileIdxes)
}

// ---- promise 1 ----
type ReadBlobResolve = (content: string | ArrayBuffer | null) => void
function promiseReadBlob(blob:Blob, isText:boolean) {
	return new Promise(function (resolve:ReadBlobResolve, reject) {
		let reader = new FileReader();
		reader.onload = function () { resolve(reader.result); };
		reader.onerror = reject;
		reader.onabort = reject;
		if (isText)
			reader.readAsText(blob);
		else
			reader.readAsArrayBuffer(blob);
	});
}

function promiseReadGpx(filename:string, blob:Blob) {
	return promiseReadBlob(blob, true).then(textData => {
        if(!textData)
            return Promise.reject('read gpx with null')

		const p = DDPAI.preprocessRawGpxFile(textData as string, 160, '\n');
		if(!UTILS.isObjectEmpty(p))
			g_gpxPreprocessContents[p.startTime] = p.content;
		refreshDownloadProgress();
		return Promise.resolve();
	});
}

const promiseReadGit = async (filename:string, blob:Blob) => {
	// API: resolve([[key1,textData1], [key2,textData2], [key3,textData3], ...])
	interface Entry{
		// https://github.com/highercomve/tarparser/blob/main/lib/index.js
		name:string
		type:string|number
		text:string
	}
	const entries:Entry[] = await promiseReadBlob(blob, false).then(c => parseTar(c as ArrayBuffer));

	if (entries.length > 0) {
		const readGpxFromEntry = (e:Entry) => {
			const entryFilename = e.name
			if ('file' == e.type) {
				const entryData = e.text
				if (entryData)
					return promiseReadGpx(entryFilename, new Blob([entryData]));
				else
					return Promise.reject(new Error('Entrydata is null: ' + entryFilename));
			} else {
				return Promise.reject(new Error(entryFilename+ ' is not a file in ' + filename));
			}
		}

		let promises:PromiseLike<any>[] = [];
		if (isMobileUserAgent()) {
			const readFileDecorator = new RD.RequestDecorator(4, readGpxFromEntry)
			promises = entries.map(e => readFileDecorator.request(e));
		} else
			promises = entries.map(e => readGpxFromEntry(e));

		return Promise.allSettled(promises).then(results => {
			results.forEach(r => {
				if (r.status === 'rejected') {
					appendError(r.reason);
				}
			});
			return Promise.resolve();
		});

	} // end of if(entries)

	return Promise.reject(new Error('Can not open archive: ' + filename));
}

type HttpGetAjaxResolve = (content:string|Blob) => void
function promiseHttpGetAjax(url:string, isText:boolean) {
	return new Promise(function (resolve:HttpGetAjaxResolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.responseType = isText ? 'text' : 'blob';
		xhr.timeout = 2000;
		xhr.open('GET', url, true);
		xhr.send();
		xhr.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200){
					if(isText)
						resolve(this.response as string);
					else
						resolve(this.response as Blob)
				}else
					reject(new Error('(' + xhr.status + ') ' + url));
			}
		}
	});
}

const parseGitAndGpxFromBlob = (filename:string, blob:Blob) => {
	if (filename.endsWith('git'))
		return promiseReadGit(filename, blob);
	else if (filename.endsWith('gpx'))
		return promiseReadGpx(filename, blob);
	return Promise.reject(new Error('Filename suffix is neither gpx nor git: ' + filename));
};
// ---- promise 2 ----

</script>

<style scoped>
input[type="range"]{
	overflow: hidden;
	min-width: 18em;
}
</style>