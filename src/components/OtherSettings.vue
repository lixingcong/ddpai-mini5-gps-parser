<template>
    <div class="btn-container">
        <span class="btn-spacer">
            <button @click="syncTime">同步时间</button>
        </span>
    </div>
</template>

<script setup lang="ts">

import { Request } from '@/ddpai/types/web-api';
import * as WEBAPI from '@/ddpai/web-api'

const serverHostUrl = import.meta.env.VITE_DDPAI_SERVER_HOST as string;
const urlAPIRequestSessionID = serverHostUrl + import.meta.env.VITE_DDPAI_APIRequestSessionID
const urlAPIRequestCertificate = serverHostUrl + import.meta.env.VITE_DDPAI_APIRequestCertificate
const urlAPISyncDate = serverHostUrl + import.meta.env.VITE_DDPAI_APISyncDate


type HttpPostResolve = (content:string) => void
type HttpPostReject = (content:Error) => void

function promiseHttpPost(url:string, request:Request, withCredentials:boolean) {
	return new Promise(function (resolve:HttpPostResolve, reject:HttpPostReject) {
		let xhr = new XMLHttpRequest()
		xhr.responseType = 'text'
		xhr.timeout = 2000

        xhr.open('POST', url, true)

        for (const [key, value] of Object.entries(request.headers))
            xhr.setRequestHeader(key, value)

        xhr.withCredentials = withCredentials // 跨域

		xhr.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200){
					resolve(this.response as string)
				}else
					reject(new Error('(' + xhr.status + ') ' + url))
			}
		}

        if(request.body.length > 0)
		    xhr.send(request.body)
        else
            xhr.send()

	})
}


const syncTime = () => {
    const apiRequestSessionID = new WEBAPI.RequestSessionID()

    promiseHttpPost(urlAPIRequestSessionID, apiRequestSessionID.request(), true).then(
        (resolved) => {
            if(!apiRequestSessionID.parseResopnse(resolved))
                return Promise.reject('RequestSessionID failed')

            const sessionId = apiRequestSessionID.sessionId
            // console.log('sessionId', sessionId)
            const apiRequestCertificate = new WEBAPI.RequestCertificate(sessionId)

            return promiseHttpPost(urlAPIRequestCertificate, apiRequestCertificate.request(), true).then(
                (resolved) => {console.log('RequestCertificate done')},
                (rejected) => onError
            )
        },
        (rejected) => onError
    )
}

const onError = (s:Error) => {alert(s)}

</script>

<style scoped>

</style>