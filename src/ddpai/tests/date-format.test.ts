import { expect, test } from 'vitest'
import * as DF from '../date-format'

test('timestampToString', () => {
  const ts = DF.now() / 1000
  const fmt = 'YYYY-MM-DD HH:mm:ss SSS ddd'
  console.log('utc=false:', DF.timestampToString(ts, fmt, false))
  console.log('utc=true: ', DF.timestampToString(ts, fmt, true))
})

test('from/to RFC3339', () =>{
    const ts = 1705564686;
    const rfc3339 = DF.toRfc3339(ts)
    expect(rfc3339).toBe('2024-01-18T07:58:06Z')
    expect(DF.fromRfc3339(rfc3339)).toBe(ts)
})