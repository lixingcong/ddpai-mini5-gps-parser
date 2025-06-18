"use strict"

export {
    timeShift,
    clearInvalidAltitude,
    fixDescription,
    removeAll,
    sampleByDistance,
    sampleByTimeInterval,
    sampleByIndexInterval,
    sampleBetweenTime,
    convertTrackToLine,
    sortByName,
    removeIfContainTrack,
    splitAllPaths
};

/**
 * 时间加上固定偏移，一般用于时区校正
 */
const timeShift = function(trackFile) {
    const OffsetHour = -4; // 向前调整4小时
    const OffsetSecond = OffsetHour * 3600;
    const Offset = wp => { if(undefined != wp.timestamp) wp.timestamp += OffsetSecond; }

    trackFile.points.forEach(point => { Offset(point.wayPoint); });
    trackFile.lines.forEach(path => { path.wayPoints.forEach(Offset); });
    trackFile.tracks.forEach(path => { path.wayPoints.forEach(Offset); });

    return [trackFile];
}

/**
 * 搜索坐标海拔为0的点，并将其海拔置为空白（去除噪声数据）
 */
const clearInvalidAltitude = function(trackFile) {
    const Clear = wp => { if (0 == wp.altitude) wp.altitude = undefined; }

    trackFile.points.forEach(point => { Clear(point.wayPoint); });
    trackFile.lines.forEach(path => { path.wayPoints.forEach(Clear); });
    trackFile.tracks.forEach(path => { path.wayPoints.forEach(Clear); });

    return [trackFile];
}

/**
 * 判断描述字段是否为CDATA，若是，则加上正确的标签。
 *
 * 在两步路App导出的轨迹可能会生成不合法的KML描述：如
 *
 * <description>
 *   <div>通过“两步路”生成</div>
 *   <div>上传者:ABC</div>
 *   <div>开始时间:2020-09-20 09:01:05</div>
 *   <div>结束时间:2020-09-20 18:19:50</div>
 * </description>
 *
 * 需要给这段desc加上CDATA起始末尾标签，生成结果：
 *  <description>
 *    <![CDATA[通过“两步路”生成]]>
 *    <![CDATA[上传者:ABC]]>
 *    <![CDATA[开始时间:2020-09-20 09:01:05]]>
 *    <![CDATA[结束时间:2020-09-20 18:19:50]]>
 *  </description>
 *
 * 有的KML轨迹甚至转义div写入到kml文件中：如
 *
 * <description>
 *    &lt;div&gt;时间：2020-10-18 06:14:26&lt;/div&gt;
 * </description>
 *
 * 需要给这段desc加上CDATA起始末尾标签，生成结果：
 *
 * <description>
 *   <![CDATA[<div>时间：2020-10-18 06:14:26</div>]]>
 * </description>
 */
const fixDescription = function(trackFile) {
    // 匹配<tagName>开头和</tagName>结尾
    const Regex = /^\<[a-zA-z0-9]*?\>.*\<\/[a-zA-z0-9]*?\>$/;
    const Check = o => {
        if(undefined == o.description)
            return;
        if (typeof o.description === 'string' && o.description.match(Regex))
            o.description = { '__cdata': o.description };
        else if(typeof o.description === 'object' && 'div' in o.description)
            o.description = { '__cdata': o.description.div};
    }

    Check(trackFile);
    trackFile.points.forEach(Check);
    trackFile.lines.forEach(Check);
    trackFile.tracks.forEach(Check);

    return [trackFile];
}

/**
 * 移除轨迹文件中的点、线、轨迹
 */
const removeAll = function(trackFile) {
    trackFile.points = [];
    trackFile.lines = [];
    trackFile.tracks = [];

    return [trackFile];
}

/**
 * 对轨迹抽样，精简轨迹（按位移阈值）
 * 将位移距离小于10米的点位剔除，只保留位移大于10米的点
 * 注意：首尾两点不会被移除
 */
const sampleByDistance = function(trackFile) {
    const MinDistance = 10;
    const Check = path => {
        let lastWayPoint = undefined;
        const tailIdx = path.wayPoints.length - 1;
        path.wayPoints.forEach((wp, idx, arr) => {
            if (undefined == lastWayPoint || tailIdx == idx) {
                  lastWayPoint = wp;
                return;
            }
            if (lastWayPoint.distanceTo(wp) < MinDistance)
                arr[idx] = undefined; // remove it
            else
                lastWayPoint = wp;
        });

        path.wayPoints = path.wayPoints.filter(wp => undefined != wp);
    };

    trackFile.lines.forEach(Check);
    trackFile.tracks.forEach(Check);

    return [trackFile];
}

/**
 * 对轨迹抽样，精简轨迹（按固定时间间隔）
 * 注意：首尾两点不会被移除
 */
const sampleByTimeInterval = function(trackFile) {
    const Interval = 2; // 每2秒取样
    const Check = path => {
        let lastWayPoint = undefined;
        const tailIdx = path.wayPoints.length - 1;
        path.wayPoints.forEach((wp, idx, arr) => {
            if (undefined == lastWayPoint || tailIdx == idx) {
                  lastWayPoint = wp;
                return;
            }
            if (wp.timestamp - lastWayPoint.timestamp < Interval)
                arr[idx] = undefined; // remove it
            else
                lastWayPoint = wp;
        });

        path.wayPoints = path.wayPoints.filter(wp => undefined != wp);
    };

    trackFile.tracks.forEach(Check);

    return [trackFile];
}

/**
 * 对轨迹抽样，精简轨迹（按固定间隔点数）
 * 注意：首尾两点不会被移除
 */
const sampleByIndexInterval = function(trackFile) {
    const Interval = 3; // 每3个点取样
    const Check = path => {
        let lastIndex = undefined;
        const tailIdx = path.wayPoints.length - 1;
        path.wayPoints.forEach((wp, idx, arr) => {
            if (undefined == lastIndex || tailIdx == idx) {
                  lastIndex = 0;
                return;
            }
            if (idx - lastIndex < Interval)
                arr[idx] = undefined; // remove it
            else
                lastIndex = idx;
        });

        path.wayPoints = path.wayPoints.filter(wp => undefined != wp);
    };

    trackFile.tracks.forEach(Check);
    trackFile.lines.forEach(Check);

    return [trackFile];
}

/**
 * 对轨迹抽样，精简轨迹（取出某段时间内的轨迹）
 */
const sampleBetweenTime = function(trackFile) {
    const T  = s => Date.parse(s) / 1000;
    const T1 = T('2024-02-16T04:30:00+08:00');
    const T2 = T('2024-02-16T06:00:00+08:00');

    const Filter = wp => T1 <= wp.timestamp && wp.timestamp <= T2;
    trackFile.tracks.forEach(path => {
        path.wayPoints = path.wayPoints.filter(Filter);
    });

    trackFile.tracks = trackFile.tracks.filter(path => path.wayPoints.length > 0);

    return [trackFile];
}

/**
 * 将轨迹转为不含时间信息的路径
 */
const convertTrackToLine = function(trackFile) {
    // 这里只做简单的判断是否轨迹重叠：起点是否为同一个点（2米内）
    const MinDistance = 2;

    let lineStarts = trackFile.lines.map(path => path.wayPoints[0]);

    trackFile.tracks.forEach(path => {
        const trackStart = path.wayPoints[0];
        const same = lineStarts.find(lineStart => lineStart.distanceTo(trackStart) < MinDistance);
        if(!same){
            trackFile.lines.push(path);
            lineStarts.push(trackStart);
        }
    });

    trackFile.tracks = []; // clear

    if (trackFile.lines.length > 0)
        return [trackFile];

    return []; // ignore if track is empty
}

/**
 * 按名字排序，不改变文件内容，只改排序
 */
const sortByName = function(trackFile) {
    const cmp = (a, b) => a.name.localeCompare(b.name);
    trackFile.points.sort(cmp);
    trackFile.tracks.sort(cmp);
    trackFile.lines.sort(cmp);
    return [trackFile];
}

/**
 * 将轨迹以json形式输出到页面body底部，可以提供给其它编程语言进行进一步处理
 */
const downloadAsJson = function(trackFile) {
    // 文件名包含冒号，在Windows下不合法
    const trackFilename = trackFile.name ? trackFile.name.replaceAll(':','') : 'track';
    const filename = '导出'+trackFilename+'.json'

    const downloadLink = document.createElement("a");
    downloadLink.innerText = filename;
    downloadLink.setAttribute('download', filename);
    downloadLink.setAttribute('href', URL.createObjectURL(new Blob([JSON.stringify(trackFile, null, 2)])));

    const className = 'exportJsonHook';

    // 可以在F12控制台中，手动敲命令：移除旧的下载链接
    // const oldElements = document.getElementsByClassName(className);
    // for (let i = 0; i < oldElements.length; i++) oldElements[i].remove();

    const div = document.createElement("div");
    div.setAttribute('class', className)

    div.append(downloadLink);
    document.body.appendChild(div);

    return [trackFile];
}

/**
 * 移除那些包含轨迹的文件
 */
const removeIfContainTrack = function(trackFile) {
    if(trackFile.tracks.length > 0)
        return [];
    return [trackFile];
}

/**
 * 分拆所有轨迹、线条
 * 也就是将一个kml文件拆成多个kml文件，每个kml只有一个轨迹
 */
const splitAllPaths = function(trackFile) {
    let ret =[];

    const Split = (path, isLine) => {
        let t = {
            // TrackFile的定义，参考src/ddpai/track.ts的构造函数
            name: '',
            description: '',
            points: [],
            lines: [],
            tracks: []
        }
        if(isLine)
            t.lines=[path];
        else
            t.tracks=[path];
        ret.push(t);
    }

    const SplitLine = path => Split(path, true);
    const SplitTrack = path => Split(path, false);

    trackFile.lines.forEach(SplitLine);
    trackFile.tracks.forEach(SplitTrack);

    return ret;
}