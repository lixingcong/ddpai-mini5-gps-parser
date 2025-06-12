<template>
    <div>
        <div>
            <input type="file" id="select-files" name="files[]" multiple accept=".kml,.gpx" />
        </div>

        <div>
            <select id="select-convert-format">
                <option value="kml">转为KML</option>
                <option value="gpx">转为GPX</option>
            </select>

            <span class="btn-spacer">
                <button id="convert">执行</button>
            </span>
            <span class="help-tip">
                <p>仅支持本站导出的轨迹文件格式之间相互转换，不保证兼容其它工具</p>
            </span>
        </div>

        <details>
            <summary>其它参数</summary>
            <div class="btn-container">
                <label><input type="checkbox" id="enable-export-beautify"></input>美化缩进</label>
                <span class="help-tip">
                    <p>缩进：插入空白进行缩进对齐，牺牲文件尺寸，改善XML文件的可读性</p>
                </span>
                <label><input type="checkbox" id="force-convert-same-fmt"></input>若格式相同也转换</label>
                <span class="help-tip">
                    <p>若输入文件格式与输出一致，如kml转kml，也进行强制转换。若不设置强制转换，则对源文件不做任何修改</p>
                </span>
            </div>
            <div class="btn-container">
                <label>小地图长度</label>
                <input type="number" id="canvas-width" min="40" max="1600" value="100" style="max-width: 5em;" />
                <label>高度</label>
                <input type="number" id="canvas-height" min="40" max="1600" value="70" style="max-width: 5em;" />
            </div>
            <div class="btn-container">
                <label><input type="checkbox" id="use-trackfile-hook"></input>对TrackFile进行后处理</label>
                <span class="help-tip">
                    <p>构建TrackFile对象，对轨迹进行后处理，如将路径坐标偏移，或者移除高度信息，需要对本项目源码熟悉</p>
                </span>
                <a target="_blank"
                    href="https://github.com/lixingcong/ddpai-mini5-web-client/blob/master/trackfile-hook-sample.js">参考源码</a>
            </div>
            <textarea id="trackfile-hook-func" rows="12" cols="0" style="display: none;">
import { TrackFile } from "./track.js";

window.trackFileHook = function(trackFile){
 const offset = wp => {
   const X = 0.1;
   wp.lat += X;
   wp.lon += X;
   if (wp.altitude) wp.altitude += X;
 }

 trackFile.points.forEach(point => { offset(point.wayPoint); });
 trackFile.lines.forEach(path => { path.wayPoints.forEach(offset); });
 trackFile.tracks.forEach(path => { path.wayPoints.forEach(offset); });

 return [trackFile]; // 若返回多个TrackFile对象，则分拆轨迹成多文件
}</textarea>
        </details>

    </div>
</template>

<script setup lang="ts" name="Converter">
import "@/views/ddpai.css"
</script>

<style lang="">

</style>