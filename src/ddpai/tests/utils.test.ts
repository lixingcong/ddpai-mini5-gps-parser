import * as UTILS from '../utils'
import { expect, test } from 'vitest'

test.each([
    [0, '0m'],
    [1, '1m'],
    [10, '10m'],
    [100, '100m'],
    [1000, '1000m'],
    [1234, '1.2km'],
    [12340, '12.3km'],
])('meterToString(%d) => %s', (input, output) => {
    expect(UTILS.meterToString(input)).toBe(output)
})

test.each([
    [0, 1],
    [1, 1],
    [10, 2],
    [200, 3],
    [2000, 4]
])('intWidth(%d) => %d', (input, output) => {
    expect(UTILS.intWidth(input)).toBe(output)
})

test.each([
    [0, '0s'],
    [1, '1s'],
    [59, '59s'],
    [590, '9m'],
    [5900, '1.6h'],
    [59000, '16.4h']
])('secondToHumanReadableString(%d) => %s', (input, output) => {
    expect(UTILS.secondToHumanReadableString(input)).toBe(output)
})

test.each([
    [0, '0B'],
    [1, '1B'],
    [11, '11B'],
    [111, '111B'],
    [1023, '1023B'],
    [1024, '1.0K'],
    [1025, '1.0K'],
    [1111, '1.1K'],
    [10000, '9.8K'],
    [9000000, '8.6M'],
])('byteToHumanReadableSize(%d) => %s', (input, output) => {
    expect(UTILS.byteToHumanReadableSize(input)).toBe(output)
})

test.each([
    [undefined, true],
    [null, true],
    [{}, true],
    [new Object, true],
    [{2:23}, false],
    [[], true],
    [[3,4,5], false],
])('isObjectEmpty(%o) => %o', (input, output) => {
    expect(UTILS.isObjectEmpty(input)).toBe(output)
})

test.each([
    [[5,0], '5'],
    [[5,1], '5'],
    [[5,2], '05'],
    [[5,4], '0005'],
    [[15,0], '15'],
    [[15,1], '15'],
    [[15,2], '15',],
    [[15,3], '015']
])('zeroPad(%o) => %s', (input, output) => {
    expect(UTILS.zeroPad(input[0], input[1])).toBe(output)
})

{
    const timestamps  = [0,1,2,5,6,9,13,14,15,17,20,23,26,27,31,35,36]

    test.each([
        [0, [timestamps]],
        [1, [[0,1,2], [5,6], [9], [13,14,15], [17], [20], [23], [26,27], [31], [35,36]]],
        [2, [[0,1,2], [5,6], [9], [13,14,15,17], [20], [23], [26,27], [31], [35,36]]],
        [3, [[0,1,2,5,6,9], [13,14,15,17,20,23,26,27], [31], [35,36]]],
        [4, [timestamps]]
    ])('splitOrderedNumbersByThreshold(%d)', (input, output) => {
        const splited = UTILS.splitOrderedNumbersByThreshold(timestamps, input)
        expect(splited).toEqual(output)
    })
}
