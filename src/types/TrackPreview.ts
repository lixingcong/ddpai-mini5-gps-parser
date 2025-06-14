import { type PaintResult } from "@/ddpai/types/track"
import { type DownloadLinkProps } from "./DownloadLink"

interface ConvertProps
{
    keepSameFormat: boolean
    trackPointCount:number
    trackLineCount:number
    trackPathCount:number
}

interface DownloadProps
{
    prefix: string
    duration: number // 持续时间
    lineDistance: number // 直线距离
    realDistance: number // 真实距离
}

interface TrackPreviewProps {
    paintResult:PaintResult
    canvasWidth: number
    canvasHeight: number
    addToClass: boolean

    downloadLink?:DownloadLinkProps
    convert?:ConvertProps
    download?:DownloadProps
}

export{
    type ConvertProps,
    type DownloadProps,
    type TrackPreviewProps
}