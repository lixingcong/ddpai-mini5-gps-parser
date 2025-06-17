import * as GPX from '../gpx';
import { expect, test } from 'vitest'
import * as TEST_COMMON from './common';

const document = new GPX.Document('DocName');

if(1){
    document.wpts.push(new GPX.Wpt('Point 1',22.8820573, 114.5768273, undefined, 123, undefined));
    document.wpts.push(new GPX.Wpt('Point 2',22.8821573, 114.5769273, 567, undefined, undefined));
}

if(1){
    document.rtes.push(new GPX.Rte('Route 1', [
        new GPX.Wpt(undefined, 22.8820573, 114.5768273, 10, undefined, undefined),
        new GPX.Wpt(undefined, 22.8821573, 114.5769273, 12, undefined, undefined),
        new GPX.Wpt(undefined, 22.8822573, 114.5770273, 13, undefined, undefined),
        new GPX.Wpt(undefined, 22.8823573, 114.5771273, 14, undefined, undefined)
    ], undefined));

    document.rtes.push(new GPX.Rte('Route 2', [
        new GPX.Wpt(undefined, 23.8825573, 114.5771273, undefined, undefined, undefined),
        new GPX.Wpt(undefined, 22.8826573, 114.5772273, undefined, undefined, undefined),
        new GPX.Wpt(undefined, 22.8827573, 114.5773273, undefined, undefined, undefined),
        new GPX.Wpt(undefined, 22.8828573, 114.5774273, undefined, undefined, undefined)
    ], undefined));
}

if(1){
    {
        const trk=new GPX.Trk('Track 1', [
            new GPX.Trkseg([
                new GPX.Wpt(undefined, 22.785665, 114.1690076, 10, 1244, undefined),
                new GPX.Wpt(undefined, 22.785675, 114.1690086, 11, 1245, undefined),
                new GPX.Wpt(undefined, 22.785685, 114.1690096, 12, 1246, undefined),
                new GPX.Wpt(undefined, 22.785695, 114.1690106, undefined, 1247, undefined)
            ]),
            new GPX.Trkseg([
                new GPX.Wpt(undefined, 22.785696, 114.1690076, 13, 1250, undefined),
                new GPX.Wpt(undefined, 22.785697, 114.1690085, undefined, 1251, undefined),
                new GPX.Wpt(undefined, 22.785698, 114.1690094, undefined, 1252, undefined),
                new GPX.Wpt(undefined, 22.785699, 114.1690103, 11, 1253, undefined)
            ])
        ], undefined);
        document.trks.push(trk);
    }

    {
        const trk=new GPX.Trk('Track 2', [
            new GPX.Trkseg([
                new GPX.Wpt(undefined, 22.785705, 114.1691076, undefined, 1234, undefined),
                new GPX.Wpt(undefined, 22.785715, 114.1691086, undefined, 1235, undefined),
                new GPX.Wpt(undefined, 22.785725, 114.1691096, undefined, 1236, undefined),
                new GPX.Wpt(undefined, 22.785735, 114.1691106, undefined, 1237, undefined)
            ])
        ], undefined);
        document.trks.push(trk);
    }
}

const content = document.toFile(true);
const documentFromContent = GPX.Document.fromFile(content);

test('GPX', () => {
    // write the OK result
    TEST_COMMON.writeFile('/tmp/gpx2.gpx', content, undefined);

    expect.soft(documentFromContent).toBeDefined()

    if(documentFromContent){
        const same = TEST_COMMON.isObjectEqual(document, documentFromContent)
        expect.soft(document).toEqual(documentFromContent)

        if(!same){
            // write the NG result
            TEST_COMMON.writeFile('/tmp/gpx2-diff.gpx', documentFromContent.toFile(true) , undefined)
        }
    }
})