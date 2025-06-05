import * as TRACK from '../track';
import * as WP from '../waypoint'
import { expect, test } from 'vitest'
import * as TEST_COMMON from './common';


let track = new TRACK.TrackFile('DocName');
track.description = "Doc description xxx";

if(1){
    track.points = [
        new TRACK.Point('Point 1', new WP.WayPoint(22.1234, 114.1234, 10, 20), undefined),
        new TRACK.Point('Point 2', new WP.WayPoint(22.1235, 114.1235), undefined)
    ];
    track.points.forEach((p, idx) => {p.description='Point description '+(1+idx)});
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
    ];
    track.lines.forEach((p, idx) => {p.description='Line description '+(1+idx)});
}

if(1){
    let timestamp = 1705575812;

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
    ];
    track.tracks.forEach((p, idx) => {p.description='Track description '+(1+idx)});
}

// 是否kml/gpx写到磁盘
const NeedToWrite = false

test('KML Track', () => {
    const kmlDoc= track.toKMLDocument();
    const kmlFileContent = kmlDoc.toFile(true);

    if(NeedToWrite)
        TEST_COMMON.writeFile('/tmp/track-1.kml', kmlFileContent, undefined);

    const trackFromDoc = TRACK.TrackFile.fromKMLDocument(kmlDoc);
    expect.soft(trackFromDoc).toBeDefined()

    if(trackFromDoc){
        const trackToKmlContent = trackFromDoc.toKMLDocument().toFile(true);
        const same = TEST_COMMON.md5sum(kmlFileContent) == TEST_COMMON.md5sum(trackToKmlContent);
        expect.soft(same).toBeTruthy()

        if(NeedToWrite && !same)
           TEST_COMMON.writeFile('/tmp/track-1-diff.kml', trackToKmlContent, undefined);
    }
})

test('GPX Track', () => {
    const gpxDoc= track.toGPXDocument();
    const gpxFileContent = gpxDoc.toFile(true);

    if(NeedToWrite)
        TEST_COMMON.writeFile('/tmp/track-1.gpx', gpxFileContent, undefined);

    const trackFromDoc = TRACK.TrackFile.fromGPXDocument(gpxDoc);
    expect.soft(trackFromDoc).toBeDefined()

    if(trackFromDoc){
        const trackToGpxContent = trackFromDoc.toGPXDocument().toFile(true);
        const same = TEST_COMMON.md5sum(gpxFileContent) == TEST_COMMON.md5sum(trackToGpxContent);
        expect.soft(same).toBeTruthy()

        if(NeedToWrite && !same)
           TEST_COMMON.writeFile('/tmp/track-1-diff.gpx', trackToGpxContent, undefined);
    }
})