import { expect, assertType, test } from 'vitest'
import * as TRACK from '../track';
import * as WP from '../waypoint'

import {
    timeShift,
    clearInvalidAltitude,
    fixDescription,
    removeAll,
    sampleByDistance,
    sampleByTimeInterval,
    sampleByIndexInterval,
    sampleBetweenTime,
    convertTrackToLine,
    sortByName,
    splitAllPaths
} from './trackfile-hook-sample'

function demoTrackFile() {
    let track = new TRACK.TrackFile('DocName');

    track.points = [
        new TRACK.Point('Point 1', new WP.WayPoint(22.1234, 114.1234, 10, 20), undefined),
        new TRACK.Point('Point 2', new WP.WayPoint(22.1235, 114.1235), undefined)
    ];


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

    track.description = "Doc description xxx";
    track.points.forEach((p, idx) => { p.description = 'Point description ' + (1 + idx) });
    track.lines.forEach((p, idx) => { p.description = 'Line description ' + (1 + idx) });
    track.tracks.forEach((p, idx) => { p.description = 'Track description ' + (1 + idx) });

    return track;
}

const StandardTrackFile = demoTrackFile()

test.each([
    ['timeShift', timeShift],
    ['clearInvalidAltitude', clearInvalidAltitude],
    ['fixDescription', fixDescription],
    ['removeAll', removeAll],
    ['sampleByDistance', sampleByDistance],
    ['sampleByTimeInterval', sampleByTimeInterval],
    ['sampleByIndexInterval', sampleByIndexInterval],
    ['sampleBetweenTime', sampleBetweenTime],
    ['convertTrackToLine', convertTrackToLine],
    ['sortByName', sortByName],
    ['splitAllPaths', splitAllPaths]
])('hook %s', (_, hook) => {
    const trackFile = demoTrackFile()
    hook(trackFile)
})