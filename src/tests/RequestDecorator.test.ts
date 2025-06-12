import * as RD from '../RequestDecorator'
import { expect, test } from 'vitest'

function promiseSleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function promiseDone(delay: number, throwErr: boolean) {
    const prefix: string = 'promiseDone()'

    return promiseSleep(delay).then(() => {
        if (throwErr)
            return Promise.reject(prefix + 'reject')
        return Promise.resolve(prefix + 'resolve')
    })
}

function promiseDeeper(delay: number, num: number) {
    const prefix: string = num + 'promiseDeeper()'

    return promiseDone(delay, num % 2 == 0).then((okString) => {
        return Promise.resolve(prefix + okString)
    }, (ngString) => {
        return Promise.reject(prefix + ngString)
    })
}

test.each([
    [7, 100, 3, 350],
    [7, 100, 4, 250],
    [7, 100, 8, 150]
])('RequestDecorator queueSize=%d, delay=%d, concurrent=%d, expectTotalTime=%d',
    async (queueSize: number, delay: number, concurrent: number, expectTotalTime: number) => {
        let rd = new RD.RequestDecorator(concurrent, promiseDone)
        let promises = Array(queueSize).fill(delay).map((delay, idx) => rd.request(delay, idx % 2 == 0))

        const beginTime = Date.now()
        await Promise.allSettled(promises).then(results => {
            results.forEach((r, idx) => {
                const actualRejected = r.status === 'rejected'
                const expectRejected = idx % 2 == 0
                expect.soft(actualRejected).toBe(expectRejected)
            })
        })
        const endTime = Date.now()

        expect(endTime - beginTime < expectTotalTime).toBeTruthy()
    })

test('RequestDecorator arg chain', async () => {
    let rd = new RD.RequestDecorator(3, promiseDeeper)
    let promises = Array(4).fill(10).map((delay, idx) => rd.request(delay, idx))

    await Promise.allSettled(promises).then(results => {
        results.forEach((r, idx) => {
            const prefix = idx + 'promiseDeeper()promiseDone()'

            if (r.status === 'rejected')
                expect(r.reason).toBe(prefix + 'reject')
            else
                expect(r.value).toBe(prefix + 'resolve')
        })
    })
})