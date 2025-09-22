import * as GPS from '../gps'
import * as DDPAI_T from '../types/ddpai'
import { expect, test } from 'vitest'

test('mergeIntervals', () => {
    const input = [[1, 2], [3, 5], [6, 10], [0, 1], [0, 3]]
    const expectOutput:DDPAI_T.MergedIntervals = { intervals: [[0, 5], [6, 10]], index: [0, 0, 1, 0, 0] }
    expect(GPS.mergeIntervals(input as DDPAI_T.Interval[])).toEqual(expectOutput)
})

test('API_RequestSessionID', () => {
    const input = '{"errcode":0,"data":"{\\"acSessionId\\":\\"syGT8SOiGv0f1bOjL81aXP0arbiLWf8\\"}"}'
    const expectOutput = 'syGT8SOiGv0f1bOjL81aXP0arbiLWf8'
    const actual = GPS.API_RequestSessionID(input)
    expect(actual).toEqual(expectOutput)
})

test.each([
    ['12345.6789', 123.761315],
    ['2345.6789', 23.761315],
    ['345.6789', 3.7613149999999997],
    ['045.6789', 0.761315],
    ['12345.0', 123.75]
])('dddmmToDecimal(%s) => %s', (input, output) => {
    expect(GPS.dddmmToDecimal(input)).toBe(output)
})

test('gpxToWayPointDict', () => {
    const testGpxFileContent = '\
$GPSCAMTIME 20210215124812\n\
$GPGGA,044815.000,0021.333,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A\n\
$GPRMC,044816.000,A,0121.333,N,12345.26001,E,5.426,190.52,150221,,,A*4B\n\
$GPGGA,044816.000,0121.333,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A\n\
$GPRMC,044817.000,A,0221.333,N,12345.26001,E,5.426,190.52,150221,,,A*4B\n\
$GPRMC,,V,,,,,,,,,,N*4D\n\
$GPGGA,,,,,,0,00,,,M,,M,,*78\n\
$GPRMC,044820.000,A,0321.23412,N,12345.26121,E,8.857,191.97,150221,,,A*42\n\
$GPRMC,044828.000,A,4021.23412,N,12345.26121,E,8.857,191.97,150221,,,A*42\n\
$GPGGA,044828.000,4021.23412,N,12345.26121,E,1,24,0.60,1.0,M,-4.8,M,,*60\n\
$GPRMC,044829.000,A,4121.23185,N,12345.26071,E,7.602,191.39,150221,,,A*49\n\
$GPGGA,044829.000,4121.23185,N,12345.26071,E,1,24,0.60,0.9,M,-4.8,M,,*66\n\
$GPRMC,044830.000,A,4221.22985,N,12345.26029,E,6.816,188.82,150221,,,A*47\n\
$GPRMC,044830.279,V,,,,,,,240221,,,N*5F\n\
$GPGGA,044831.279,,,,,0,00,,,M,,M,,*6D\n\
$GPRMC,044831.279,V,,,,,,,240221,,,N*5E\n\
$GPGGA,044832.279,,,,,0,00,,,M,,M,,*6C\n\
$GPGGA,044832.000,4221.22985,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A\n\
$GPRMC,044833.000,A,4321.22812,N,12345.26001,E,5.426,190.52,150221,,,A*4B\n\
$ABILITY,D,1613364448000,1613364504000,60,0,238\n\
$GSENSORSTARTTIME 20210215124811\n\
$GSENSORDATAFREQUENCY 50 v2.0\n\
$GYRO,-0.569954,0.202751,0.271148\n\
$GSENSOR,0.003565,0.006836,-1.582607\n\
$GYRO,-0.550880,0.263787,0.778503'

    const expectPreprocessedOutput = {
        startTime: 1613393292,
        content: [
            '$GPGGA,044815.000,0021.333,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A',
            '$GPRMC,044816.000,A,0121.333,N,12345.26001,E,5.426,190.52,150221,,,A*4B',
            '$GPGGA,044816.000,0121.333,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A',
            '$GPRMC,044817.000,A,0221.333,N,12345.26001,E,5.426,190.52,150221,,,A*4B',
            '$GPRMC,,V,,,,,,,,,,N*4D',
            '$GPGGA,,,,,,0,00,,,M,,M,,*78',
            '$GPRMC,044820.000,A,0321.23412,N,12345.26121,E,8.857,191.97,150221,,,A*42',
            '$GPRMC,044828.000,A,4021.23412,N,12345.26121,E,8.857,191.97,150221,,,A*42',
            '$GPGGA,044828.000,4021.23412,N,12345.26121,E,1,24,0.60,1.0,M,-4.8,M,,*60',
            '$GPRMC,044829.000,A,4121.23185,N,12345.26071,E,7.602,191.39,150221,,,A*49',
            '$GPGGA,044829.000,4121.23185,N,12345.26071,E,1,24,0.60,0.9,M,-4.8,M,,*66',
            '$GPRMC,044830.000,A,4221.22985,N,12345.26029,E,6.816,188.82,150221,,,A*47',
            '$GPRMC,044830.279,V,,,,,,,240221,,,N*5F',
            '$GPGGA,044831.279,,,,,0,00,,,M,,M,,*6D',
            '$GPRMC,044831.279,V,,,,,,,240221,,,N*5E',
            '$GPGGA,044832.279,,,,,0,00,,,M,,M,,*6C',
            '$GPGGA,044832.000,4221.22985,N,12345.26029,E,1,24,0.60,0.9,M,-4.8,M,,*6A',
            '$GPRMC,044833.000,A,4321.22812,N,12345.26001,E,5.426,190.52,150221,,,A*4B'
    ]}

    const preprocessedOutput = GPS.preprocessRawGpxFile(testGpxFileContent, 100, '\n')
    expect(preprocessedOutput).toEqual(expectPreprocessedOutput)

    const expectWaypointOutput = {
        '1613364496':  {
          lat: 1.35555,
          lon: 123.754334,
          timestamp: 1613364496,
          altitude: 0.9,
          speed: 10.048952000000002,
          heading: 190.52,
          hdop: 0.6
        },
        '1613364497':  {
          lat: 2.35555,
          lon: 123.754334,
          timestamp: 1613364497,
          altitude: undefined,
          speed: 10.048952000000002,
          heading: 190.52,
          hdop: undefined
        },
        '1613364500':  {
          lat: 3.353902,
          lon: 123.754353,
          timestamp: 1613364500,
          altitude: undefined,
          speed: 16.403164,
          heading: 191.97,
          hdop: undefined
        },
        '1613364508':  {
          lat: 40.353902,
          lon: 123.754353,
          timestamp: 1613364508,
          altitude: 1,
          speed: 16.403164,
          heading: 191.97,
          hdop: 0.6
        },
        '1613364509':  {
          lat: 41.353864,
          lon: 123.754345,
          timestamp: 1613364509,
          altitude: 0.9,
          speed: 14.078904000000001,
          heading: 191.39,
          hdop: 0.6
        },
        '1613364510':  {
          lat: 42.353831,
          lon: 123.754338,
          timestamp: 1613364510,
          altitude: undefined,
          speed: 12.623232,
          heading: 188.82,
          hdop: undefined
        },
        '1613364513':  {
          lat: 43.353802,
          lon: 123.754334,
          timestamp: 1613364513,
          altitude: undefined,
          speed: 10.048952000000002,
          heading: 190.52,
          hdop: undefined
        }
      }
    const waypointOutput = GPS.gpxToWayPointDict(preprocessedOutput.content)
    expect(waypointOutput).toEqual(expectWaypointOutput)
})