import { type WayPointIntf } from "./waypoint"

type XY = [number, number]

interface Point
{
    name?:string
    description?:string
    wayPoint:WayPointIntf
}

interface Path
{
    name?:string
    description?:string
    wayPoints:WayPointIntf[]
}

enum PaintCmd
{
    TrackStart=0,
    TrackPoint=1,
    TrackEnd=2
}

interface PaintPoint
{
    x:number
    y:number
    cmd:PaintCmd
}

interface PaintResult
{
    points: PaintPoint[]
    horizontalDistance:number // 画布的实际距离（米）
    verticalDistance:number // 画布的实际距离（米）

    topLeft?:XY // 这些点位构成的Rect左上角
    bottomRight?:XY
}

export{
    type Point,
    type Path,
    PaintCmd,
    type PaintPoint,
    type PaintResult,
    type XY
}