import * as TRACK_I from './ddpai/types/track';

// 画布的起终点圆点半径
const CanvasPointRadius = 3;

/**
 * @param {HTMLCanvasElement} canvas 画布
 * @param {[TRACK_I.PaintPoint]} paintPoints TRACK_I.paint()返回的结果中的点位数组。
 * @param {bool} showEdgePoint 是否绘制起始点、结束点
 * @param {int} width 画布大小
 * @param {int} height 画布大小
 * @returns {boolean} 是否绘制成功
 */
function newCanvasDiv(canvas:HTMLCanvasElement, paintPoints:TRACK_I.PaintPoint[], showEdgePoint:boolean, width:number, height:number) : boolean{
    canvas.width = width + CanvasPointRadius * 2;
    canvas.height = height + CanvasPointRadius * 2;

    const ctx = canvas.getContext('2d');
    if(!ctx)
        return false;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';

    let startPts:TRACK_I.XY[]=[];
    let endPts:TRACK_I.XY[]=[];

    paintPoints.forEach(paintPoint => {
        const pt = [paintPoint.x + CanvasPointRadius, paintPoint.y + CanvasPointRadius] as TRACK_I.XY;

        switch(paintPoint.cmd){
            case TRACK_I.PaintCmd.TrackStart:
                ctx.beginPath();
                ctx.moveTo(pt[0], pt[1]);
                startPts.push(pt);
                break;
            case TRACK_I.PaintCmd.TrackPoint:
                ctx.lineTo(pt[0], pt[1]);
                break;
            case TRACK_I.PaintCmd.TrackEnd:
                ctx.lineTo(pt[0], pt[1]);
                ctx.stroke();
                endPts.push(pt);
                break;
        }
    });

    if(showEdgePoint){
        ctx.fillStyle = '#02f21a';
        startPts.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], CanvasPointRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#fa5e37';
        endPts.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], CanvasPointRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    return true
}

export{newCanvasDiv}