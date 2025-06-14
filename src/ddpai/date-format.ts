import dayjs from "dayjs"
import updateLocale from 'dayjs/plugin/updateLocale'
dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
	weekdays: [
		"周日", "周一", "周二", "周三", "周四", "周五", "周六"
	]
})

// ts: 秒
function timestampToString(ts:number, fmt:string, utc:boolean):string {
    if(utc)
        ts-=28800 // 固定写死GMT+8
	const d = dayjs.unix(ts)
	return d.format(fmt)
}

// 返回毫秒
function now():number {
	return Date.now()
}

// 秒
function toRfc3339(ts:number):string
{
	return timestampToString(ts, 'YYYY-MM-DDTHH:mm:ss', true) + 'Z'
}

// 秒
function fromRfc3339(str:string):number
{
	return dayjs(str).unix()
}

export {
	timestampToString,
	now,
	toRfc3339,
	fromRfc3339
}