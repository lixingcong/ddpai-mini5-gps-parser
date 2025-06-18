import * as DF from './date-format'
import * as FXP from 'fast-xml-parser'
import { type XmlIntf, type XmlStringIntf } from './types/xml'

const toObject = (c:XmlIntf) => c.toObject()
const toObjects = (arr:XmlIntf[]) => arr.map( c => c.toObject())
const toStrings = (arr:XmlStringIntf[]) => arr.map( c => c.toString())

// XML文件中恒为数组的TagName
const AlwaysArray = ['Style', 'Placemark', 'Folder', 'gx:coord', 'when']

const XMLParserOptions={
    ignoreAttributes: false,
    parseAttributeValue: true,
    attributeNamePrefix: "@",
    cdataPropName: "__cdata",
    isArray: (name:any, jpath:any, isLeafNode:boolean, isAttribute:boolean) => {
        if(isAttribute)
            return false
        if(jpath.endsWith('gx:MultiTrack.gx:Track')) // 特殊
            return true
        return AlwaysArray.indexOf(name) !== -1
    }
}

class Document
{
    name?:string
    description?:string
    styles:Style[] // Style对象数组
    placeMarks:PlaceMark[] // PlaceMark数组
    folders:Folder[] // Folder数组

    constructor(name?:string)
    {
        this.name= name
        this.styles = []; // Style对象数组
        this.placeMarks = []; // PlaceMark数组
        this.folders = []; // Folder数组
    }

    toFile(beautify = false):string
    {
        const kmlJson={
            '?xml':{
                '@version':'1.0',
                '@encoding':'UTF-8'
            },
            'kml':{
                '@xmlns':'http://www.opengis.net/kml/2.2',
                '@xmlns:gx':'http://www.google.com/kml/ext/2.2',
                'Document': {
                    'name': this.name,
                    'description': this.description,
                    'Style': toObjects(this.styles),
                    'Placemark': toObjects(this.placeMarks),
                    'Folder': toObjects(this.folders)
                }
            }
        }

        const builder = new FXP.XMLBuilder(Object.assign(XMLParserOptions, {'format':beautify}))
        return builder.build(kmlJson)
    }

    static fromFile(content:string):Document|undefined
    {
        const parser = new FXP.XMLParser(XMLParserOptions)
        const kmlJson = parser.parse(content)
        if(kmlJson && 'kml' in kmlJson && 'Document' in kmlJson.kml){
            let ret = new Document()
            let docJson = kmlJson.kml.Document
            ret.name = docJson.name
            ret.description = docJson.description

            if(undefined != docJson.Style)
                ret.styles = (docJson.Style as any[]).map(o => Style.fromObject(o))

            if(undefined != docJson.Placemark)
                ret.placeMarks =  (docJson.Placemark as any[]).map(o => PlaceMark.fromObject(o))

            if(undefined != docJson.Folder)
                ret.folders = (docJson.Folder as any[]).map(a => Folder.fromObject(a))
            return ret
        }

        return undefined
    }
}

class PlaceMark implements XmlIntf
{
    name?:string
    description?:string
    styleId?:string // 字符串，样式的ID名字
    point?:Point // Point对象
    gxTrack?:GxTrack // GxTrack对象
    gxMultiTrack?:GxMultiTrack // GxMultiTrack对象
    lineString?:LineString // LineString对象

    constructor(name?:string)
    {
        this.name = name
    }

    toObject():object
    {
        return {
            'name':this.name,
            'description':this.description,
            'styleUrl': (undefined == this.styleId ? undefined : '#' + this.styleId),
            'Point': (undefined == this.point ? undefined : toObject(this.point)),
            'gx:Track':(undefined == this.gxTrack ? undefined : toObject(this.gxTrack)),
            'gx:MultiTrack':(undefined == this.gxMultiTrack ? undefined : toObject(this.gxMultiTrack)),
            'LineString':(undefined == this.lineString ? undefined : toObject(this.lineString))
        }
    }

    static fromObject(o:any):PlaceMark
    {
        let ret = new PlaceMark(o.name)
        ret.description = o.description
        if(undefined != o.styleUrl)
            ret.styleId = o.styleUrl.replace(/^#/g,'')
        if(undefined != o.Point)
            ret.point = Point.fromObject(o.Point)
        if(undefined != o['gx:Track'])
            ret.gxTrack = GxTrack.fromObject(o['gx:Track'])
        if(undefined != o['gx:MultiTrack'])
           ret.gxMultiTrack = GxMultiTrack.fromObject(o['gx:MultiTrack'])
        if(undefined != o.LineString)
            ret.lineString = LineString.fromObject(o.LineString)
        return ret
    }
}

class Style implements XmlIntf
{
    id?:string
    lineColor?:string
    lineWidth:number

    constructor(id?:string, lineColor?:string, lineWidth?:number)
    {
        // Not fully support IconStyle,StyleMap...
        this.id = id
        this.lineColor = lineColor
        this.lineWidth = lineWidth ? lineWidth : 1
    }

    toObject():object
    {
        //if(undefined == this.lineColor || undefined == this.lineWidth)
        //    return undefined

        return {
            '@id':this.id,
            'LineStyle':{
                'color':this.lineColor,
                'width':this.lineWidth
            }
        }
    }

    static fromObject(o:any):Style
    {
        let ret = new Style(o['@id'])
        if(undefined != o.LineStyle){
            ret.lineColor = o.LineStyle.color
            ret.lineWidth = o.LineStyle.width
        }
        return ret
    }
}

class Coordinate implements XmlStringIntf
{
    lat:number
    lon:number
    altitude?:number

    constructor(lat:number, lon:number, altitude?:number)
    {
        this.lat = lat
        this.lon = lon
        this.altitude = altitude
    }

    toString():string
    {
        let ret = this.lon +','+this.lat
        if(undefined!=this.altitude)
            ret += ',' + this.altitude
        return ret
    }

    static fromString(s:string):Coordinate|undefined
    {
        const splited = s.split(',')
        if(splited.length>=2)
        {
            let ret = new Coordinate(parseFloat(splited[1]), parseFloat(splited[0]))
            if(splited.length >=3)
                ret.altitude = parseFloat(splited[2])
            return ret
        }
        return undefined
    }
}

class Coordinates implements XmlStringIntf
{
    coordinateArray:Coordinate[]

    constructor(coordinateArray:Coordinate[])
    {
        this.coordinateArray = coordinateArray; // Coordinate对象数组
    }

    toString():string
    {
        return toStrings(this.coordinateArray).join(' ')
    }

    static fromString(s:string): Coordinates
    {
        const coords:(Coordinate|undefined)[] = s.split(' ').map(cs => Coordinate.fromString(cs))
        return new Coordinates(coords.filter(c => undefined !== c ))
    }
}

class Point implements XmlIntf
{
    coordinate:Coordinate
    altitudeMode:string

    constructor(coordinate:Coordinate, altitudeMode:string)
    {
        this.coordinate = coordinate
        this.altitudeMode = altitudeMode
    }

    toObject():object
    {
        return {
            'altitudeMode':this.altitudeMode,
            'coordinates':this.coordinate.toString()
        }
    }

    static fromObject(o:any):Point|undefined
    {
        const coord = Coordinate.fromString(o.coordinates)
        if(coord)
            return new Point(coord, o.altitudeMode)
        return undefined
    }
}

const AltitudeMode = {
	// 海拔模式 https://developers.google.com/kml/documentation/altitudemode
	RelativeToGround: 'relativeToGround', // 基于地球表面
	Absolute: 'absolute', // 基于海平面
	RelativeToSeaFloor: 'relativeToSeaFloor', // 基于主水体的底部
	ClampToGround: 'clampToGround', //（此项作为默认值）海拔被忽略，沿地形放置在地面上
	ClampToSeaFloor: 'clampToSeaFloor' // 海拔被忽略，沿地形放置在主水体的底部
}

class When implements XmlStringIntf
{
    timestamp:number

    constructor(timestamp:number)
    {
        this.timestamp = timestamp; // int
    }

    toString():string
    {
        return DF.toRfc3339(this.timestamp)
    }

    static fromString(s:string):When
    {
        return new When(DF.fromRfc3339(s))
    }
}

class GxCoord implements XmlStringIntf
{
    lat:number
    lon:number
    altitude?:number

    constructor(lat:number, lon:number, altitude?:number)
    {
        this.lat = lat
        this.lon = lon
        this.altitude = altitude
    }

    toString():string
    {
        let gxCoord = this.lon + ' ' + this.lat
        if(undefined != this.altitude)
            gxCoord += ' ' + this.altitude
        return gxCoord
    }

    static fromString(s:string):GxCoord|undefined
    {
        const splited = s.split(' ')
        if(splited.length>=2)
        {
            let ret = new GxCoord(parseFloat(splited[1]), parseFloat(splited[0]))
            if(splited.length >=3)
                ret.altitude = parseFloat(splited[2])
            return ret
        }
        return undefined
    }
}

class GxTrack implements XmlIntf
{
    altitudeMode:string
    whenArray:When[]
    gxCoordArray:GxCoord[]

    // GPGGA记录中的高度是海平面高度。因此建议值为absolute
    constructor(altitudeMode?:string)
    {
        this.altitudeMode = altitudeMode ? altitudeMode : AltitudeMode.Absolute
        this.whenArray = []; // When对象数组
        this.gxCoordArray =[]; // GxCoord对象数组
    }

    append(when:When, gxCoord:GxCoord)
    {
        this.whenArray.push(when)
        this.gxCoordArray.push(gxCoord)
    }

    toObject():object
    {
        return {
            'altitudeMode':this.altitudeMode,
            'when': toStrings(this.whenArray),
            'gx:coord': toStrings(this.gxCoordArray)
        }
    }

    static fromObject(o:any):GxTrack
    {
        let ret = new GxTrack(o.altitudeMode)
        if(undefined != o.when)
            ret.whenArray = (o.when as any[]).map(s => When.fromString(s))

        if(undefined != o['gx:coord']){
            const arr = (o['gx:coord'] as any[]).map(s => GxCoord.fromString(s))
            ret.gxCoordArray = arr.filter(g => undefined !== g)
        }
        return ret
    }
}

class GxMultiTrack implements XmlIntf
{
    altitudeMode:string
    gxTracks:GxTrack[]

    // GPGGA记录中的高度是海平面高度。因此默认为absolute
    constructor(gxTracks:GxTrack[], altitudeMode?:string)
    {
        this.altitudeMode = altitudeMode ? altitudeMode : AltitudeMode.Absolute
        this.gxTracks = gxTracks; // GxTrack对象，要求每个Track构造时传入altitudeMode=undefined
    }

    toObject():object
    {
        return {
            'altitudeMode':this.altitudeMode,
            'gx:interpolate': 0,
            'gx:Track': toObjects(this.gxTracks)
        }
    }

    static fromObject(o:any):GxMultiTrack
    {
        let ret = new GxMultiTrack([], o.altitudeMode)
        if(undefined != o['gx:Track'])
            ret.gxTracks = (o['gx:Track'] as any[]).map(o => GxTrack.fromObject(o))
        return ret
    }
}

class LineString implements XmlIntf
{
    coordinates: Coordinates
    altitudeMode:string

    constructor(coordinates:Coordinates, altitudeMode?:string)
    {
        this.coordinates = coordinates; // Coordinates对象
        this.altitudeMode = altitudeMode ? altitudeMode : AltitudeMode.Absolute
    }

    toObject():object
    {
        return {
            'tessellate': 1,
            'altitudeMode':this.altitudeMode,
            'coordinates': this.coordinates.toString()
        }
    }

    static fromObject(o:any):LineString|undefined
    {
        const coordinateText = o['coordinates']
        if(undefined != coordinateText){
            return new LineString(Coordinates.fromString(coordinateText), o.altitudeMode)
        }
        return undefined
    }
}

class Folder implements XmlIntf
{
    name?:string
    description?:string
    placeMarks:PlaceMark[]; // PlaceMark对象数组

    constructor(name:string|undefined, placeMarks:PlaceMark[], description?:string)
    {
        this.name = name
        this.placeMarks = placeMarks; // PlaceMark对象数组
        this.description = description
    }

    toObject():object
    {
        return {
            'name' : this.name,
            'description': this.description,
            'Placemark' : toObjects(this.placeMarks)
        }
    }

    static fromObject(o:any):Folder
    {
        let ret = new Folder(o.name, [], o.description)
        if(undefined != o.Placemark)
            ret.placeMarks = (o.Placemark as any[]).map(o => PlaceMark.fromObject(o))
        return ret
    }
}

export {
    AltitudeMode,
    Document,
    PlaceMark,
    Style,
    Point,
    Coordinate,
    Coordinates,
    When,
    GxCoord,
    GxTrack,
    GxMultiTrack,
    LineString,
    Folder
}