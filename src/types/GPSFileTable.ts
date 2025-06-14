// 按照一天颗粒度，将GPS的时间分成一组
// 如一天有2个行程，则将这行程分为同一组

interface GPSFileGroup{
    name: string // 样例：'05-20' 表示5月20日
    gpsFileArrayIdxes: number[] // 样例：[0,1,5] 表示对应的DDPAI.GPSFile数组的下标
}

export{type GPSFileGroup}