import * as WEBAPI from './types/web-api'
import * as DDPAI from './types/ddpai'

import * as DDPAI222 from './ddpai'

class GpsFileList extends WEBAPI.AstractWebAPI
{
    files:DDPAI.GPSFile[] = []
    timestampOffset = -28800 // 盯盯拍固件中timestamp时差（猜想是厂商的固定值？没有参数可以更改该值）

    request(): WEBAPI.Request
    {
        return {headers:{}, body:''}
    }

    parseResopnse(body: string): boolean
    {
        this.files.length = 0
        const j = JSON.parse(body)
        if(j && 0===j.errcode){
            const file = JSON.parse(j.data).file as DDPAI.API_GPSFile[]
            const timespan = file.map(f => [parseInt(f.starttime) + this.timestampOffset, parseInt(f.endtime) + this.timestampOffset] as DDPAI.Interval)
            const filenames = file.map(f => f.name)
            const mergedResult = DDPAI222.mergeIntervals(timespan)

            this.files = mergedResult.intervals.map(m => ({ 'from': m[0], 'to': m[1], 'filename': [] }))
            mergedResult.index.forEach((mergedTimespanIdx, timespanIdx) => {
                this.files[mergedTimespanIdx].filename.push(filenames[timespanIdx])
            })

            return true
        }

        return false
    }
}

export { GpsFileList}