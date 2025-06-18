interface WayPointIntf{
    lat?: number // 十进制纬度 latitude
    lon?: number // 十进制经度 longitude

    timestamp?: number // Unix时间戳（秒）
    altitude?: number // 海拔高度单位：米
    speed?: number // 速度单位：km/h
    heading?: number // 航向单位：度
    hdop?: number // 水平精度单位：米

    hasGeometry():boolean // 是否含有经纬度信息
    hasTimestamp():boolean
    hasAltitude():boolean
    hasSpeed():boolean
    hasHeading():boolean
    hasHdop():boolean

    toXY():[number, number]
    distanceTo(other: WayPointIntf):number
}

export{
    type WayPointIntf
}