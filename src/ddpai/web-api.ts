import * as WEBAPI from './types/web-api'
import * as GPS_I from './types/gps'
import * as GPS from './gps'

const TimestampOffset = 28800 // 盯盯拍固件中timestamp时差（猜想是厂商的固定值？没有参数可以更改该值）
const IMEI = '6b6014501d19a893'

class GpsFileListReq extends WEBAPI.Astract
{
    files:GPS_I.GPSFile[] = []

    request(): WEBAPI.Request
    {
        return {headers:{}, body:''}
    }

    parseResopnse(body: string): boolean
    {
        this.files.length = 0
        const j = JSON.parse(body)
        if(j && 0===j.errcode){
            interface GPSFile
            {
                starttime: string
                endtime: string
                name: string
            }

            const file = JSON.parse(j.data).file as GPSFile[]
            const timespan = file.map(f => [parseInt(f.starttime) - TimestampOffset, parseInt(f.endtime) - TimestampOffset] as GPS_I.Interval)
            const filenames = file.map(f => f.name)
            const mergedResult = GPS.mergeIntervals(timespan)

            this.files = mergedResult.intervals.map(m => ({ 'from': m[0], 'to': m[1], 'filename': [] }))
            mergedResult.index.forEach((mergedTimespanIdx, timespanIdx) => {
                this.files[mergedTimespanIdx].filename.push(filenames[timespanIdx])
            })

            this.files.forEach(i => { i.filename.sort() })

            return true
        }

        return false
    }
}

class RequestSessionID extends WEBAPI.Astract
{
    sessionId: string = ''

    request(): WEBAPI.Request
    {
        return {headers:{}, body:''}
    }

    parseResopnse(body: string): boolean
    {
        this.sessionId = ''

        const j = JSON.parse(body)
        if(0 == j.errcode){
            this.sessionId = JSON.parse(j.data).acSessionId as string;
            return true
        }

        return false
    }
}

class RequestCertificate extends WEBAPI.Astract
{
    readonly sessionId: string = ''

    constructor(sessionId:string)
    {
        super()
        this.sessionId = sessionId
    }

    request(): WEBAPI.Request
    {
        return {
            headers:{
                'sessionid': this.sessionId,
                'Cookie': `SessionID=${this.sessionId}`
            },
            body:`{"user":"admin","password":"admin","level":0,"uid":"${IMEI}"}`
        }
    }

    parseResopnse(body: string): boolean
    {
        const j = JSON.parse(body)
        return 0 == j.errcode
    }
}

export { GpsFileListReq, RequestSessionID, RequestCertificate }