import * as DF from './date-format.js';
import * as FXP from 'fast-xml-parser';
import { type XmlIntf } from './types/xml';

const toObjects = (arr:XmlIntf[]) => arr.map(c => c.toObject());

// 需要特殊处理xml转出来的数组（个数为1时很特别，因此要始终看作数组）
const AlwaysArray = ['trk','trkseg','trkpt', 'wpt', 'rte', 'rtept'];

const XMLParserOptions={
    ignoreAttributes: false,
    parseAttributeValue: true,
    attributeNamePrefix: "@",
    cdataPropName: "__cdata",
    isArray: (name:any, jpath:any, isLeafNode:boolean, isAttribute:boolean) => {
        if(isAttribute)
            return false;
        return AlwaysArray.indexOf(name) !== -1;
    }
};

class Document
{
    name:string|undefined
    description:string|undefined
    trks:Trk[]
    rtes:Rte[]
    wpts:Wpt[]

    constructor(name:string|undefined)
    {
        this.name = name;
        this.description = undefined; // 仅处理desc标签，不处理cmt标签。（可让用户自行替换gpx文件中的cmt）
        this.trks = [];
        this.rtes = [];
        this.wpts = [];
    }

    toFile(beautify = false):string
    {
        const gpxJson = {
            '?xml':{
                '@version':'1.0',
                '@encoding':'UTF-8'
            },
            'gpx':{
                '@version':'1.1',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@xmlns': 'http://www.topografix.com/GPX/1/1',
                '@xsi:schemaLocation': 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
                'name':this.name,
                'desc':this.description,
                'wpt':toObjects(this.wpts),
                'rte':toObjects(this.rtes),
                'trk':toObjects(this.trks)
            }
        }

        const builder = new FXP.XMLBuilder(Object.assign(XMLParserOptions, {'format':beautify}));
        return builder.build(gpxJson);
    }

    static fromFile(content:string):Document|undefined
    {
        const parser = new FXP.XMLParser(XMLParserOptions);
        const gpxJson = parser.parse(content);
        if(gpxJson && 'gpx' in gpxJson){
            let ret = new Document(undefined);
            let docJson = gpxJson.gpx;
            ret.name = docJson.name;
            ret.description = docJson.desc;

            if(undefined != docJson.wpt)
                ret.wpts = (docJson.wpt as any[]).map(o => Wpt.fromObject(o));

            if(undefined != docJson.rte)
                ret.rtes = (docJson.rte as any[]).map(o => Rte.fromObject(o));

            if(undefined != docJson.trk)
                ret.trks = (docJson.trk as any[]).map(o => Trk.fromObject(o));

            return ret;
        }
        return undefined;
    }
}

class Wpt implements XmlIntf
{
    name:string|undefined
    description:string|undefined
    lat:number
    lon:number
    altitude:number|undefined;
    timestamp:number|undefined;

    constructor(name:string|undefined, lat:number, lon:number, altitude:number|undefined, timestamp:number|undefined, description:string|undefined)
    {
        this.name = name;
        this.description = description;
        this.lat = lat;
        this.lon = lon;
        this.altitude = altitude;
        this.timestamp=timestamp;
    }

    toObject():object
    {
        return {
            'name':this.name,
            'desc':this.description,
            '@lat':this.lat,
            '@lon':this.lon,
            'ele':this.altitude,
            'time':(undefined == this.timestamp? undefined: DF.toRfc3339(this.timestamp))
        };
    }

    static fromObject(o:any):Wpt
    {
        let ts:number|undefined;
        if(undefined != o.time)
            ts = DF.fromRfc3339(o.time);

        let ret = new Wpt(o.name, o['@lat'], o['@lon'], o.ele, ts, o.desc);
        return ret;
    }
}

class Rte implements XmlIntf
{
    name:string|undefined
    description:string|undefined
    rtepts:Wpt[]

    constructor(name:string|undefined, rtepts:Wpt[], description:string|undefined)
    {
        this.name = name;
        this.description = description;
        this.rtepts = rtepts;
    }

    toObject():object
    {
        return {
            'name':this.name,
            'desc':this.description,
            'rtept': toObjects(this.rtepts)
        };
    }

    static fromObject(o:any):Rte
    {
        let ret = new Rte(o.name, [], undefined);
        if(undefined != o.rtept)
            ret.rtepts = (o.rtept as any[]).map(o => Wpt.fromObject(o));

        ret.description=o.desc;
        return ret;
    }
}

class Trk implements XmlIntf
{
    name:string|undefined
    trksegs:Trkseg[]
    description:string|undefined

    constructor(name:string|undefined, trksegs:Trkseg[], description:string|undefined)
    {
        this.name = name;
        this.description = description;
        this.trksegs = trksegs;
    }

    toObject():object
    {
        return {
            'name': this.name,
            'desc':this.description,
            'trkseg' :toObjects(this.trksegs)
        };
    }

    static fromObject(o:any):Trk
    {
        let ret = new Trk(o.name, [], undefined);
        ret.description=o.desc;
        if(undefined != o.trkseg)
            ret.trksegs = (o.trkseg as any[]).map(o => Trkseg.fromObject(o));

        return ret;
    }
}

class Trkseg implements XmlIntf
{
    trkpts:Wpt[]

    constructor(trkpts:Wpt[] = [])
    {
        this.trkpts = trkpts;
    }

    toObject():object
    {
        return {
            'trkpt' : toObjects(this.trkpts)
        };
    }

    static fromObject(o:any):Trkseg
    {
        let ret = new Trkseg;
        if(undefined != o.trkpt)
            ret.trkpts = (o.trkpt as any[]).map(o => Wpt.fromObject(o));
        return ret;
    }
}

export {
    Document,
    Wpt,
    Rte,
    Trk,
    Trkseg
}