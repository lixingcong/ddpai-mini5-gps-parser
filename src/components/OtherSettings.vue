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

type HttpPostResolve = (content:string) => void
type HttpPostReject = (content:Error) => void

function promiseHttpPost(url:string, request:Request) {
	return new Promise((resolve:HttpPostResolve, reject:HttpPostReject) => {
		let xhr = new XMLHttpRequest()
		xhr.responseType = 'text'
		xhr.timeout = 2000

        xhr.open('POST', url, true)

        for (const [key, value] of Object.entries(request.headers))
            xhr.setRequestHeader(key, value)

        xhr.withCredentials = true // 跨域

		xhr.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200){
					resolve(this.response as string)
				}else{
                    reject(new Error('(' + xhr.status + ') ' + url))
                }
			}
		}

        if(request.body.length > 0)
		    xhr.send(request.body)
        else
            xhr.send()
	})
}


const syncTime = () => {
    const hourString = prompt('将记录仪的时钟，调快多少小时？', '0')
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