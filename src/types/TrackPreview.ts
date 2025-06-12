import { type PaintResult } from "@/ddpai/types/track"

interface Props {
    paintResult:PaintResult
    canvasWidth: number
    canvasHeight: number
    filename: string
    fileBlob: Blob
    keepSameFormat: boolean
    trackPointCount:number
    trackLineCount:number
    trackPathCount:number
}

export{type Props}