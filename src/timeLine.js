'use strict'

// 时间轴状态常量
const STATUS_INITIAL = 0
const STATUS_ONGOING = 1
const STATUS_PAUSED = 2

// 默认状态1s执行60帧动画
const DEFAULT_INTERVAL = 1000 / 60

/**
 * 时间轴类
 */
class TimeLine {
    constructor(interval) {
        // 用户自定义时间间隔或默认值
        this.interval = interval
        // 初始时间轴状态
        this.status = STATUS_INITIAL
        // 用于记录timer的ID
        this.frameId = null
        // 总体暂停时长
        this.totalPauseTime = 0
    }

    /**
     * 用户自定义的回调函数
     * 在每一帧动画后被回调
     * 这里的每一帧是指：
     * 累计的requestAnimationFrame >= interval
     * @param time 从动画开始到当前的执行时间
     * pause的时间被排除在外
     */
    actionAfterFrame(time) {
    }

    /**
     * 开始函数
     * 只有在initial标志位才能调用
     */
    start() {
        // 通过状态过滤
        if (this.status === STATUS_ONGOING) {
            return
        }
        // 将状态置为执行状态
        this.status = STATUS_ONGOING

        // 设置动画的开始时间戳
        this.startTime = +new Date()
        this.totalPauseTime = 0

        // +new Date(), new Date().getTime(), new Date().valueOf()相同
        this._startTimeline()
    }

    /**
     * 暂停函数
     * 时间轴若在初始或暂停状态
     * 函数调用无效
     */
    pause() {
        // 过滤状态
        if (this.status !== STATUS_ONGOING) {
            return
        }

        // 将状态置为暂停状态
        this.status = STATUS_PAUSED

        // 需要设置一个暂停时间戳
        this.pauseTime = +new Date()

        // 暂停
        cancelAnimationFrame(this.frameId)
    }

    /**
     * 重启函数
     * 暂停后重启时间轴
     */
    restart() {
        // 过滤状态
        if (this.status !== STATUS_PAUSED) {
            return
        }

        // 将状态置为执行
        this.status = STATUS_ONGOING

        // 计算暂停时间,并进行累加
        this.totalPauseTime += (+new Date() - this.pauseTime)

        // 重新激活时间戳
        this._startTimeline()
    }

    /**
     * 激活函数，激活时间轴
     * @param startTime 动画开始的时间（减去了暂停的时间）
     * @private 仅供内部调用
     */
    _startTimeline() {
        const self = this
        let lastTick = +new Date()
        nextTick()

        function nextTick() {
            let nowTick = +new Date()

            // 异步调用
            self.frameId = _requestAnimationFrame(nextTick)

            // 如果累加的时间大于设定的interval
            // 执行自定义的回调并对时间戳进行更新
            if (nowTick - lastTick >= self.interval) {
                self.actionAfterFrame(nowTick - self.startTime - self.totalPauseTime)
                lastTick = nowTick
            }
        }
    }
}

/**
 * 封装requestAnimationFrame并向后兼容
 * 直接利用setTimeout来设置延时并不准确
 * 不是最优雅的做法
 */
let _requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        // 以上都不支持时，使用setTimeout来兼容
        function (callback) {
            return window.setTimeout(callback, DEFAULT_INTERVAL)
        }
})()

/**
 * 封装cancelAnimationFrame并向后兼容
 * 接收记录好的frameId
 */
let _cancelAnimationFrame = (function () {
    return window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        function (id) {
            return window.clearTimeout(id)
        }
})()

export default TimeLine


