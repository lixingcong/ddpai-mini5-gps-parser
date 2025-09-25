<template>
    <div class="btn-container">
        <span class="btn-spacer">
            <button @click="syncTime">同步时间</button>
        </span>
    </div>
</template>

<script setup lang="ts">

import { type Request } from '@/ddpai/types/web-api';
import * as WEBAPI from '@/ddpai/web-api'

const serverHostUrl = import.meta.env.VITE_DDPAI_SERVER_HOST as string;
const urlAPIRequestSessionID = serverHostUrl + import.meta.env.VITE_DDPAI_APIRequestSessionID
const urlAPIRequestCertificate = serverHostUrl + import.meta.env.VITE_DDPAI_APIRequestCertificate
const urlAPISyncDate = serverHostUrl + import.meta.env.VITE_DDPAI_APISyncDate
const urlAPILogout = serverHostUrl + import.meta.env.VITE_DDPAI_API_Logout

function promiseHttpPost(url:string, request:Request) {
    const body = request.body.length > 0 ? request.body: null
    const controller = new AbortController() // 超时控制
	setTimeout(() => {controller.abort()}, 2000)

    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include', // 跨域
        headers: request.headers,
        body: body,
        signal: controller.signal
    }).then(r => r.text())
}

const syncTime = () => {
    const hourString = prompt('基于浏览器当前的时间，将记录仪的时钟再调快多少小时？', '0')
    if(!hourString || hourString.length <= 0)
        return

    const timestampOffset = parseInt(hourString)*3600

    const apiRequestSessionID = new WEBAPI.RequestSessionID()

    promiseHttpPost(urlAPIRequestSessionID, apiRequestSessionID.request()).then(
        (resolved) => {
            if(!apiRequestSessionID.parseResopnse(resolved))
                return Promise.reject('Parse RequestSessionID failed')

            const sessionId = apiRequestSessionID.sessionId
            // console.log('RequestSessionID ok, value=', sessionId)
            const apiRequestCertificate = new WEBAPI.RequestCertificate(sessionId)

            return promiseHttpPost(urlAPIRequestCertificate, apiRequestCertificate.request()).then(
                (resolved) => {
                    if(!apiRequestCertificate.parseResopnse(resolved))
                        return Promise.reject(new Error('Parse RequestCertificate failed'))

                    // console.log('RequestCertificate done')
                    const now = Math.round((new Date()).getTime() / 1000)
                    const apiSyncDate = new WEBAPI.SyncDate(sessionId, now + timestampOffset)

                    return promiseHttpPost(urlAPISyncDate, apiSyncDate.request()).then(
                        (resolved) => {
                            // console.log('SyncDate done')

                            const apiLogout = new WEBAPI.CookiesRequest(sessionId)
                            return promiseHttpPost(urlAPILogout, apiLogout.request())
                        },
                    )
                },
            )
        }
    ).catch(onError)
}

const onError = (s:Error) => {alert(s)}

</script>

<style scoped>

</style>