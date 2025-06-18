import { type WayPointIntf } from "./waypoint"

// 表示起始时刻，结束时刻
type Interval=[number, number]

// 时间戳映射到点位
type TimeToWaypoint = { [key: number]: WayPointIntf }

// 合并好的间隔
interface MergedIntervals
{
    intervals: Interval[]
    index: number[] // 原数组下标
}

interface API_GPSFile
{
    starttime: string
    endtime: string
    name: string
}

interface GPSFile
{
    from: number // 时间戳
    to: number // 时间戳
    filename: string[] // 多个git/gpx文件名
}

interface GpxFile
{
    startTime: number
    content: string[] // 每行数据
}

export{
    type Interval,
    type MergedIntervals,
    type GPSFile,
    type API_GPSFile,
    type TimeToWaypoint,
    type GpxFile
}