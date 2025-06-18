import * as Track from './ddpai/track'

interface Converted
{
    name:string
    content?:string
    trackFile?: Track.TrackFile
}

class MyFile
{
    name:string // 源名字
    content?:string // 源数据
    converted: Converted[] // Converted对象
    keepSameFormat: boolean // 当目标格式与源格式相同时，保持原样，无需转换
    trackFile?: Track.TrackFile

    constructor(name:string)
    {
        this.name = name;
        this.converted = [];
        this.keepSameFormat = false;
    }

    parseName():[string,string] | undefined
    {
        // 额外的处理，得出文件名、小写的扩展名
        const splited = this.name.split('.')
        const splitedCount = splited.length
        if(splitedCount>1){
            const suffix=splited[splitedCount-1].toLowerCase()
            const prefix=this.name.substring(0, this.name.length-suffix.length - 1)
            return [prefix, suffix]; // prefix: 不含'.'字符
        }
        return undefined
    }
}

export{
    MyFile
}