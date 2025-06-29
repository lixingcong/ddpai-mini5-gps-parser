import * as KML from '../kml'
import { expect, test } from 'vitest'
import * as TEST_COMMON from './common'

const document = new KML.Document('DocName')
document.description = 'DocDescription'

const blueStyle = new KML.Style('BlueStyle','A0FF0000',5)
const greenStyle = new KML.Style('GreenStyle','D032FF30',5)
document.styles=[blueStyle, greenStyle]

if(1){
    let placeMark = new KML.PlaceMark('POI 123')
    placeMark.description='This is my point!'
    placeMark.point = new KML.Point(new KML.Coordinate(22.8820573, 114.5768273, 999), KML.AltitudeMode.Absolute)
    document.placeMarks.push(placeMark)
}

if(1){
    let placeMark = new KML.PlaceMark('Single Track 01')
    placeMark.description='This is my track!'
    placeMark.styleId = 'BlueStyle'
    placeMark.gxTrack = new KML.GxTrack(KML.AltitudeMode.Absolute)
    placeMark.gxTrack.append(new KML.When(0), new KML.GxCoord(22.8796045, 114.5740888, 61))
    placeMark.gxTrack.append(new KML.When(1), new KML.GxCoord(22.8792677, 114.5737712, 62))
    document.placeMarks.push(placeMark)
}

if(1){
    let placeMark = new KML.PlaceMark('Multi Track 02')
    placeMark.description='This is my xxxx'
    placeMark.styleId = 'BlueStyle'

    let t1= new KML.GxTrack()
    t1.append(new KML.When(10), new KML.GxCoord(22.8873613, 114.5812708, 61))
    t1.append(new KML.When(11), new KML.GxCoord(22.8873333, 114.5811908, 62))
    t1.append(new KML.When(12), new KML.GxCoord(22.8873018, 114.5811170, 63))

    let t2= new KML.GxTrack()
    t2.append(new KML.When(20), new KML.GxCoord(22.8865555, 114.5800712, 64))
    t2.append(new KML.When(21), new KML.GxCoord(22.8864997, 114.5800135, 65))
    t2.append(new KML.When(22), new KML.GxCoord(22.8864357, 114.5799503, 66))

    placeMark.gxMultiTrack = new KML.GxMultiTrack([t1, t2], KML.AltitudeMode.Absolute)
    document.placeMarks.push(placeMark)
}

if(1){
    let placeMark = new KML.PlaceMark('Line 01')
    placeMark.description='This is my line!'
    placeMark.styleId = 'GreenStyle'
    placeMark.lineString = new KML.LineString(
        new KML.Coordinates([
            new KML.Coordinate(22.8753703, 114.5686210, 456),
            new KML.Coordinate(22.8753240, 114.5684628, 457),
            new KML.Coordinate(22.8752790, 114.5683027),
            new KML.Coordinate(22.8752370, 114.5681358, 455)
        ]),
        KML.AltitudeMode.Absolute
    )
    document.placeMarks.push(placeMark)
}

if(1){
    for(let i = 0;i<2;++i){
        let folder= new KML.Folder('Folder Name '+i, [])

        for(let j:number =0;j<2;++j){
            let placeMark = new KML.PlaceMark('POI '+i+'-'+j)
            placeMark.point = new KML.Point(
                new KML.Coordinate(22.8620573+j, 114.5778273+j),
                KML.AltitudeMode.Absolute
            )
            folder.placeMarks.push(placeMark)
        }

        document.folders.push(folder)
    }
}

const content = document.toFile(true)
const documentFromContent = KML.Document.fromFile(content)

test('KML', () => {
    // write the OK result
    TEST_COMMON.writeFile('/tmp/kml2.kml', content)

    expect.soft(documentFromContent).toBeDefined()

    if(documentFromContent){
        const same = TEST_COMMON.isObjectEqual(document, documentFromContent)
        expect.soft(document).toEqual(documentFromContent)

        if(!same){
            // write the NG result
            TEST_COMMON.writeFile('/tmp/kml2-diff.kml', documentFromContent.toFile(true))
        }
    }
})