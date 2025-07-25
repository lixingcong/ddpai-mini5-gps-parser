import * as WP from './waypoint'
import * as DDPAI from './types/ddpai'
import type { WayPointIntf } from './types/waypoint'

const FirmwareTimestampOffset = -28800 // 盯盯拍固件中timestamp时差（猜想是厂商的固定值？没有参数可以更改该值）
const LatLonDecimal = 6 // 经纬度的小数位数，6位足够了。按照1纬度111km计算，保留六位小数可以精确到0.1米


/**
 * 整合多个段为单独连续的一部分 https://leetcode.com/problems/merge-intervals
 *
 * @param {array} intervals 数组为[[1,2], [2,5], [6,10], [0,1]]表示起始结束时刻的多组数据
 * @return {dict} 返回合并好的数组加索引，如上述输出为{'merged':[[0,5], [6,10]], 'index':[0,0,1,0]}
 *                                                  合并后的时间跨度                   输入值属于合并后的跨度下标
 */
function mergeIntervals(intervals:DDPAI.Interval[]) : DDPAI.MergedIntervals {
    const intervalsSorted = intervals.slice().sort((a, b) => { return a[0] - b[0]; })
    // console.log(intervalsSorted)
    let merged:DDPAI.Interval[] = []
    intervalsSorted.forEach(t => {
        const L = merged.length
        const t0 = t[0]
        const t1 = t[1]
        if (L == 0 || merged[L - 1][1] < t0)
            merged.push([t0, t1])
        else {
            let lastMerged = merged[L - 1]
            lastMerged[1] = Math.max(lastMerged[1], t1)
        }
    })

    // map interval to merged-index
    let index:number[] = []
    intervals.forEach(interval => {
        let found = false
        for (let i = 0; i < merged.length; ++i) {
            const mt = merged[i]
            if (mt[0] <= interval[0] && interval[1] <= mt[1]) {
                index.push(i)
                found = true
                break
            }
        }

        if (!found)
            throw 'Cannot found range!'
    })

    return { intervals: merged, index: index }
}

/**
 * 从json中提取出data字段
 *
 * @param {string} inputJson 输入值，即API_GpsFileListReq的结果
 * @return {array} 当errcode字段为0时，返回数组，每个元素是字典，键值对详见代码，否则返回Array()
 */
function API_GpsFileListReqToArray(inputJson:string):DDPAI.GPSFile[] {
    let j = JSON.parse(inputJson)
    let ret:DDPAI.GPSFile[]= []
    if (0 == j.errcode) {
        const file = JSON.parse(j.data).file as DDPAI.API_GPSFile[]
        const timespan = file.map(f => [parseInt(f.starttime) + FirmwareTimestampOffset, parseInt(f.endtime) + FirmwareTimestampOffset] as DDPAI.Interval)
        const filenames = file.map(f => f.name)
        const mergedResult = mergeIntervals(timespan)

        ret = mergedResult.intervals.map(m => ({ 'from': m[0], 'to': m[1], 'filename': [] }))
        mergedResult.index.forEach((mergedTimespanIdx, timespanIdx) => {
            ret[mergedTimespanIdx].filename.push(filenames[timespanIdx])
        })
    }

    ret.forEach(i => { i.filename.sort(); })
    return ret
}

/**
 * 将GPS数据中的dddmm.mmmmm转化为十进制的度数
 *
 * @param {string} dddmm 非负数 dddmm.mmmmmm格式的字符串，其中mm.mmmmmm的单位是分
 * @return {number} 转化后的十进制度数
 */
function dddmmToDecimal(dddmm:string):number {
    let s = dddmm.split('.')
    let s0 = s[0], s1 = s[1]
    let s0Len = s0.length
    let dString = s0.substr(0, s0Len - 2)
    let mString = s0.substr(s0Len - 2) + '.' + s1
    let d = parseFloat(dString)
    let m = parseFloat(mString) / 60.0
    return d + m
}

/**
 * 从ddpai中的gpx文件中提取GPS相关字段并转成数组
 * 经纬度用南纬S是负，北纬N是正，东经E是正，西经W是负
 *
 * @param {array} gpxFileContents gpx文件内容数组，每个元素为整行纯文本（已经筛选好并按照时间顺序的内容）
 * @return {array} 字典，timestamp => Waypoint对象
 */
function gpxToWayPointDict(gpxFileContents:string[]):DDPAI.TimeToWaypoint {
    let ret:DDPAI.TimeToWaypoint = {}
    const comma = ','
    let timestamp = 0; // 作为ret字典的键
    const dateObj = new Date()

    // GPGGA条目没有日期信息，只有时间信息，因此正常的顺序应该是先出现GPRMC，再紧随GPGGA，以下变量用于解决顺序颠倒问题
    let GPGGAResult:any = {}; // 保存上次GPGGA的高度、hdop信息，提供给GPRMC存储
    let GPRMCTime:number|undefined; // 保存上次GPRMC时间信息，转成纯数字
    let GPGGATime:number|undefined; // 保存上次GPGGA时间信息，转成纯数字

    function updateReturnValue(timestamp:number, keyValueDict:object){
        let wp:WayPointIntf|undefined = undefined

        if(timestamp in ret)
            wp = ret[timestamp]
        else{
            wp = new WP.WayPoint()
            ret[timestamp] = wp
            wp.timestamp = timestamp
        }

        Object.assign(wp, keyValueDict); // 赋值
    }

    gpxFileContents.forEach(line => {
        // console.log(line)
        if (line.startsWith('$GPRMC')) {
            const columns = line.split(comma)
            if (columns.length < 13) {
                // console.log('invalid GPRMC record')
                return
            }

            const valid = columns[2]
            if (valid !== 'A') {
                // console.log('invalid GPRMC record')
                return
            }

            let timeString = columns[1]
            const dateString = columns[9]
            const lat = columns[3]
            const lon = columns[5]
            if (timeString.length === 0 || dateString.length === 0 || lat.length === 0 || lon.length === 0) {
                timestamp = 0; // invalid
                // console.log('invalid GPRMC record')
                return
            }

            // column
            timeString = timeString.substr(0, 6)
            GPRMCTime = parseInt(timeString)
            const latSgn = columns[4] === 'N' ? 1.0 : -1.0
            const lonSgn = columns[6] === 'E' ? 1.0 : -1.0
            const knots = columns[7]
            const heading = columns[8]

            // datetime
            const year = 2000 + parseInt(dateString.substr(4, 2))
            const month = parseInt(dateString.substr(2, 2))
            const day = parseInt(dateString.substr(0, 2))
            const hour = parseInt(timeString.substr(0, 2))
            const minute = parseInt(timeString.substr(2, 2))
            const second = parseInt(timeString.substr(4, 2))
            //console.log(year+' '+month+' '+day+' '+hour+' '+minute+' '+second)
            dateObj.setUTCFullYear(year, month - 1, day)
            dateObj.setUTCHours(hour, minute, second, 0)
            timestamp = Math.trunc(dateObj.getTime() / 1000)

            let GPRMCResult:any = {
                lat: parseFloat((dddmmToDecimal(lat) * latSgn).toFixed(LatLonDecimal)),
                lon: parseFloat((dddmmToDecimal(lon) * lonSgn).toFixed(LatLonDecimal))
            }

            if(knots.length)
                GPRMCResult.speed = 1.852 * parseFloat(knots); // 速度单位：km/h

            if(heading.length)
                GPRMCResult.heading = parseFloat(heading); // 航向单位：度

            updateReturnValue(timestamp, GPRMCResult)

            if(GPGGATime === GPRMCTime){
                updateReturnValue(timestamp, GPGGAResult); // merge GPGGA and GPRMC
                GPGGATime = undefined; // reset
            }
        } else if (line.startsWith('$GPGGA')) {
            const columns = line.split(comma)
            if (columns.length < 15) {
                // console.log('invalid GPGGA record')
                return
            }

            const fixedMode = columns[6]; // 0=invalid; 1=GPS fix; 2=Diff. GPS fix
            if (fixedMode !== '1') {
                // console.log('invalid GPRMC record')
                return
            }

            let timeString = columns[1]
            if (timeString.length === 0) {
                timestamp = 0
                // console.log('invalid GPGGA record')
                return
            }

            GPGGATime = parseInt(timeString)
            const hdop = columns[8]
            const altitude = columns[9]

            if(hdop.length)
                GPGGAResult.hdop = parseFloat(hdop); // 水平精度单位：米

            if (altitude.length)
                GPGGAResult.altitude = parseFloat(altitude); // 海拔高度单位：米

            timeString = timeString.substr(0, 6)
            if (GPGGATime === GPRMCTime && timestamp != 0)
                updateReturnValue(timestamp, GPGGAResult); // 属于正常情况，即GPGGA那一行，出现在GPRMC后
        }
    })

    // 丢弃无效的内容
    const timestamps = Object.keys(ret)
    timestamps.forEach(timestamp => {
        if(typeof timestamp !== 'number')
            return

        const wayPoint = ret[timestamp]
        if(!wayPoint.hasTimestamp() || !wayPoint.hasGeometry())
            delete ret[timestamp]
    })

    return ret
}

/**
 * 对文件内容预处理，从ddpai中的gpx文件中提取GPS相关字段

 * @param {string} gpxFileContent gpx原文件内容，即ASCII字符串
 * @param {string} newline gpx回车换行符，应该是"\n"
 * @param {number} maxLineCount 为了提高效率，指定读取的最大行数
 * @return {object} 字典{'startTime':12345, 'content':['$GPRMC,xxxx','$GPGGA,yyyy']}
 */
function preprocessRawGpxFile(gpxFileContent:string, maxLineCount:number, newline:string):DDPAI.GpxFile{
    const lines = gpxFileContent.split(newline)
    const lineCount = Math.min(maxLineCount, lines.length)

    let ret:DDPAI.GpxFile = {startTime:0, content:[]}
    if(lineCount >= 1){
        const firstLine = lines[0]
        if(firstLine.startsWith('$GPSCAMTIME')){
            const startTimeStr=firstLine.split(' ')[1]
            let dateObj = new Date()
            const year = parseInt(startTimeStr.substr(0, 4))
            const month = parseInt(startTimeStr.substr(4, 2))
            const day = parseInt(startTimeStr.substr(6, 2))
            const hour = parseInt(startTimeStr.substr(8, 2))
            const minute = parseInt(startTimeStr.substr(10, 2))
            const second = parseInt(startTimeStr.substr(12, 2))
            dateObj.setUTCFullYear(year, month - 1, day)
            dateObj.setUTCHours(hour, minute, second, 0)
            ret.startTime = Math.trunc(dateObj.getTime() / 1000)
        }else
            return ret; // invalid

        for (let i = 1; i < lineCount; ++i) {
            const line = lines[i]
            if (line.startsWith('$GPRMC') || line.startsWith('$GPGGA'))
                ret.content.push(line)
        }
    }

    return ret
}

export {
    mergeIntervals,
    API_GpsFileListReqToArray,
    gpxToWayPointDict,
    preprocessRawGpxFile,
    dddmmToDecimal
}