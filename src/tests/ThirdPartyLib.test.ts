import { parseTar } from 'tarparser'
// import * as TEST_COMMON from '@/ddpai/tests/common'
import { expect, test } from 'vitest'
import * as fs from 'fs'
const path = require('path')

test('tarparser', async () => {
    await fs.readFile(__dirname + path.sep + 'dummy.tar', null, async (err, content)=>{
        const tarFiles = await parseTar(content)

        expect(tarFiles.length > 0).toBeTruthy()

        tarFiles.forEach(file => {
            console.log(`Name: ${file.name}, size: ${file.size}, content: ${file.data}`)
        })
    })
})