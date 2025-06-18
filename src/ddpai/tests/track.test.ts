import * as TRACK from '../track'
import * as TRACK_I from '../types/track'
import * as WP from '../waypoint'
import { expect, test } from 'vitest'
import * as TEST_COMMON from './common'
import * as GD from 'node-gd'

let track = new TRACK.TrackFile('DocName')
track.description = "Doc description xxx"

if(1){
    track.points = [
        new TRACK.Point('Point 1', new WP.WayPoint(22.1234, 114.1234, 10, 20), undefined),
        new TRACK.Point('Point 2', new WP.WayPoint(22.1235, 114.1235), undefined)
    ]
    track.points.forEach((p, idx) => {p.description='Point description '+(1+idx)})
}

if(1){
    track.lines = [
        new TRACK.Path('Line 1', [
            new WP.WayPoint(22.1236, 114.1236, undefined, 10),
            new WP.WayPoint(22.1237, 114.1237, 0, 20),
            new WP.WayPoint(22.1238, 114.1238, 1, 30)
        ], undefined),
        new TRACK.Path('Line 2', [
            new WP.WayPoint(22.1246, 114.1236),
            new WP.WayPoint(22.1247, 114.1237),
            new WP.WayPoint(22.1248, 114.1238)
        ], undefined)
    ]
    track.lines.forEach((p, idx) => {p.description='Line description '+(1+idx)})
}

if(1){
    let timestamp = 1705575812

    track.tracks = [
        new TRACK.Path('Track 1', [
            new WP.WayPoint(22.1236, 114.1236, timestamp++, 30),
            new WP.WayPoint(22.1237, 114.1237, timestamp++),
            new WP.WayPoint(22.1238, 114.1238, timestamp++, 39)
        ], undefined),
        new TRACK.Path('Track 2', [
            new WP.WayPoint(22.1246, 114.1236, timestamp++, 41),
            new WP.WayPoint(22.1247, 114.1237, timestamp++, 42),
            new WP.WayPoint(22.1248, 114.1238, timestamp++)
        ], undefined)
    ]
    track.tracks.forEach((p, idx) => {p.description='Track description '+(1+idx)})
}

// 是否kml/gpx写到磁盘
const NeedToWrite = false

test('KML Track', () => {
    const kmlDoc= track.toKMLDocument()
    const kmlFileContent = kmlDoc.toFile(true)

    if(NeedToWrite)
        TEST_COMMON.writeFile('/tmp/track-1.kml', kmlFileContent, undefined)

    const trackFromDoc = TRACK.TrackFile.fromKMLDocument(kmlDoc)
    expect.soft(trackFromDoc).toBeDefined()

    if(trackFromDoc){
        const trackToKmlContent = trackFromDoc.toKMLDocument().toFile(true)
        const same = TEST_COMMON.md5sum(kmlFileContent) == TEST_COMMON.md5sum(trackToKmlContent)
        expect.soft(same).toBeTruthy()

        if(NeedToWrite && !same)
           TEST_COMMON.writeFile('/tmp/track-1-diff.kml', trackToKmlContent, undefined)
    }
})

test('GPX Track', () => {
    const gpxDoc= track.toGPXDocument()
    const gpxFileContent = gpxDoc.toFile(true)

    if(NeedToWrite)
        TEST_COMMON.writeFile('/tmp/track-1.gpx', gpxFileContent, undefined)

    const trackFromDoc = TRACK.TrackFile.fromGPXDocument(gpxDoc)
    expect.soft(trackFromDoc).toBeDefined()

    if(trackFromDoc){
        const trackToGpxContent = trackFromDoc.toGPXDocument().toFile(true)
        const same = TEST_COMMON.md5sum(gpxFileContent) == TEST_COMMON.md5sum(trackToGpxContent)
        expect.soft(same).toBeTruthy()

        if(NeedToWrite && !same)
           TEST_COMMON.writeFile('/tmp/track-1-diff.gpx', trackToGpxContent, undefined)
    }
})

// ---------------------------------------------------
//              绘制图片
// ---------------------------------------------------

async function paint(paintResult:TRACK_I.PaintResult, jpgWidth:number, jpgHeight:number){
    const filename = '/tmp/track-preview-'+jpgWidth+'x'+jpgHeight+'.png'

    // 打印实际距离
    //const actualDistance = 'distance w='+paintResult.horizontalDistance.toFixed(1)+', h='+paintResult.verticalDistance.toFixed(1)
    //console.log(filename+', '+actualDistance)

    let pathPoints:TRACK_I.PaintPoint[]
    let pathPointsArray:TRACK_I.PaintPoint[][] = []
    paintResult.points.forEach(paintPoint => {
        if(paintPoint.cmd == TRACK_I.PaintCmd.TrackStart)
            pathPoints=[]

        pathPoints.push(paintPoint)

        if(paintPoint.cmd == TRACK_I.PaintCmd.TrackEnd)
            pathPointsArray.push(pathPoints)
    })

    const img = await GD.createTrueColor(jpgWidth, jpgHeight)

    img.fill(0, 0, 0xb0b0b0)

    const penWidth = Math.ceil(Math.min(jpgWidth,jpgHeight)/200)
    img.setThickness(penWidth)

    // paint rect
    const rectColor = img.colorAllocate(16,199,165)
    img.rectangle(paintResult.topLeft![0], paintResult.topLeft![1],
        paintResult.bottomRight![0], paintResult.bottomRight![1],
        rectColor)

    const pathColor=[
        0x000000,
        0xff0000,
        0x00ff00,
        0x0000ff,
        0xf0803c,
        0xedf060,
        0x225560
    ]
    pathPointsArray.forEach( (pts,idx) => {img.openPolygon(pts, pathColor[idx % pathColor.length]);})
    await img.savePng(filename, 1)
    img.destroy()
}

const paintPaths = [
    new TRACK.Path(undefined, [
        new WP.WayPoint(48.7251575, -3.9825900),
        new WP.WayPoint(48.7250778, -3.9825779),
        new WP.WayPoint(48.7249304, -3.9825514),
        new WP.WayPoint(48.7248155, -3.9825237),
        new WP.WayPoint(48.7247609, -3.9825013),
        new WP.WayPoint(48.7246779, -3.9824534),
        new WP.WayPoint(48.7243794, -3.9822469),
        new WP.WayPoint(48.7242453, -3.9821320)
    ],undefined),
    new TRACK.Path(undefined, [
        new WP.WayPoint(48.7233989, -3.9816133),
        new WP.WayPoint(48.7232602, -3.9814227),
        new WP.WayPoint(48.7230069, -3.9809848),
        new WP.WayPoint(48.7228084, -3.9806580),
        new WP.WayPoint(48.7225169, -3.9801481)
    ],undefined),
    new TRACK.Path(undefined, [
        new WP.WayPoint(48.7223222, -3.97623846),
        new WP.WayPoint(48.7223235, -3.97623830),
        new WP.WayPoint(48.7223496, -3.97622406),
        new WP.WayPoint(48.7224516, -3.97617903),
        new WP.WayPoint(48.7225715, -3.97612003),
        new WP.WayPoint(48.7226946, -3.97603824),
        new WP.WayPoint(48.7228045, -3.97591922),
        new WP.WayPoint(48.7228985, -3.97579397),
        new WP.WayPoint(48.7229241, -3.97572779),
        new WP.WayPoint(48.7230278, -3.97556016)
    ],undefined)
]

await test.each([
    [20,20],
    [20,40],
    [40,20],
    [50,50],
    [50,100],
    [100,50],
    [500,500],
    [500,1000],
    [1000,500],
    [1000,1000]
])('Track paint(), w=%d, h=%d', (jpgWidth, jpgHeight) => {
    const paintResult = TRACK.paint(paintPaths, jpgWidth, jpgHeight)

    expect.soft(paintResult).toBeDefined()

    if(paintResult)
        paint(paintResult, jpgWidth, jpgHeight)
})