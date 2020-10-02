'use strict'

import imagesLoader from "./imagesLoader.js"
import TimeLine from "./timeLine.js"

// 状态常量
const STATUS_INITIAL = 0
const STATUS_ONGOING = 1
const STATUS_PAUSED = 2

// 任务类型
const TASK_SYNC = 0
const TASK_ASYNC = 1

// 任务是否成功标志位
const UNSUCCESS = 0
const SUCCESS = 1

// 默认状态1s执行60帧动画
const DEFAULT_INTERVAL = 1000 / 60

/**
 * 动画类
 */
class DLAnimation {
    constructor(interval) {
        // 帧动画时间间隔
        this.interval = interval || DEFAULT_INTERVAL
        // 任务队列
        this.taskQueue = []
        // 初始状态
        this.status = STATUS_INITIAL
        // 任务索引
        this.index = 0
        // 初始化时间轴
        this.timeLine = new TimeLine(this.interval)
    }

    /**
     * 开始任务队列
     * @returns {Animation} 返回动画实例对象，方便链式调用
     */
    start() {
        // 如何不为初始状态则直接返回
        // 如果任务队列里没有任务直接返回
        if (this.status !== STATUS_INITIAL || !this.taskQueue) {
            return this
        }

        // 修改为执行状态
        this.status = STATUS_ONGOING
        this._runTask()
        return this
    }

    /**
     * 同步任务 - 暂停任务
     * @returns {Animation}
     */
    pause() {
        if (this.status === STATUS_ONGOING) {
            this.status = STATUS_PAUSED
            this.timeLine.pause()
        }
        return this
    }

    /**
     * 同步任务 - 重启任务
     * @returns {Animation}
     */
    restart() {
        if (this.status === STATUS_PAUSED) {
            this.status = STATUS_ONGOING
            this.timeLine.restart()
        }
        return this
    }

    /**
     * 同步任务 - 预加载图片
     * @param imagesList 图片集
     * @param timeout 超时时间（可选参数）
     * @returns {Animation} 返回动画实例对象，方便链式调用
     */
    loadImages(imagesList, timeout) {
        // 不让imagesLoader马上执行，而将其封装成一个任务
        const taskFn = function (next) {
            imagesLoader(imagesList.slice(), next, timeout)
        }
        // 任务类型
        const taskType = TASK_SYNC
        return this._addTask(taskFn, taskType)
    }

    /**
     * 异步任务 - 通过改变坐标来执行动画
     * @param el DOM ELEMENT
     * @param positions 坐标的数组
     * @param imageUrl 图片源
     * @param customFn 每一帧后想要额外添加的内容
     */
    changePosition(el, positions, imageUrl) {
        let taskFn, taskType
        // 判断形参是否被正常传入
        // 若正常，定义异步任务
        // 若不正常，定义同步任务，任务中直接调用callback(false)
        if (positions && imageUrl) {
            /**
             * 异步任务 - 定义异步任务具体的执行细节
             * 该函数会作为actionAfterFrame
             * 在timeline上被重复执行
             * 直到回调条件触发
             * @param next 回调函数
             * @param time 动画开始后的执行时间
             */
            taskFn = (next, time) => {
                // 坐标数组长度
                const length = positions.length
                // 当前索引
                // 按位或，向下取整
                const index = Math.min(time / this.interval | 0, length)
                const position = positions[index - 1].split(' ')
                el.style.backgroundImage = `url(${imageUrl})`
                el.style.backgroundPosition = `${position[0]}px ${position[1]}px`

                // 完成条件
                if (index === length) {
                    // 执行回调，任务完成成功
                    next(true)
                }
            }
        } else {
            // 定义同步任务
            taskFn = function (next) {
                // 执行回调，任务完成失败
                next(false)
            }
        }
        taskType = TASK_ASYNC

        return this._addTask(taskFn,taskType)
    }

    /**
     * 异步任务 - 通过改变图片源来执行动画
     * 执行方式与changePosition类似
     * @param el DOM ELEMENT
     * @param urls 图片源数组
     * @param customFn 每一帧后想要额外添加的内容
     */
    changeSrc(el, urls) {
        let taskFn, taskType
        if (urls) {
             taskFn = (next, time) => {
                 const length = urls.length
                 const index = Math.min(time / this.interval | 0, length)
                 el.src = urls[index-1]

                 if (index === length) {
                    next(true)
                }
            }
        } else {
            taskFn = function (next) {
                next(false)
            }
        }
        taskType = TASK_ASYNC

        return this._addTask(taskFn,taskType)
    }

    /**
     * 高级方法
     * 自定义每帧后的回调函数
     * @param taskFn 自定义函数
     * @returns {Animation}
     */
    customerFrame(taskFn) {
        if (taskFn) {
            this._addTask(taskFn, TASK_ASYNC)
        }
        return this
    }

    /**
     * 自定义立即执行的同步任务
     * @param callback 执行函数
     * @returns {Animation}
     */
    then(callback) {
        const taskFn = (next) => {
            callback(this)
            next(true)
        }
        const taskType = TASK_SYNC
        return this._addTask(taskFn, taskType)
    }

    /**
     * 同步任务 - 重复执行上一个任务
     * @param times 重复执行的次数
     * @param steps 回退步数
     * @returns {Animation}
     */
    repeat(steps, times) {
        const taskFn = (next) => {
            // 如果未对times进行传参数
            // 则一直执行上一个任务
            if (typeof times === 'undefined') {
                this.index -= steps || 1
                this._runTask()
                // 这里一定需要一个return
                // 不然内存泄漏，原因不明
                return
            }
            // 这里运用了闭包
            // times在repeat执行完后不会被销毁
            // 若times减小至0后，进入下一个任务
            if (times) {
                this.index -= steps || 1
                times--
                this._runTask()
            } else {
                next(true)
            }
        }
        const taskType = TASK_SYNC
        return this._addTask(taskFn, taskType)
    }

    /**
     * 同步任务 - repeat不传参更优雅的写法
     * @returns {Animation}
     */
    repeatForever() {
        return this.repeat()
    }

    /**
     * 设置上一个任务结束后的等待时间
     * 并未进入任务链
     * @param time 等待时间
     * @returns {Animation}
     */
    wait(time) {
        if (this.taskQueue) {
            const length = this.taskQueue.length
            this.taskQueue[length-1].wait = time
        } else {
            throw new Error(this._errorMsg())
        }
        return this
    }

    dispose() {
        if (this.status !== STATUS_INITIAL) {
            this.status = STATUS_INITIAL
            this.taskQueue = null
            this.timeLine.pause()
            this.timeLine = null
        }
        return this
    }

    /**
     * 添加任务
     * @param taskFn 任务函数名
     * @param taskType 任务类型
     * @returns {Animation} 返回动画实例对象，方便链式调用
     * @private 私有方法
     */
    _addTask(taskFn, taskType) {
        this.taskQueue.push({
            taskFn,
            taskType
        })
        return this
    }

    /**
     * 任务执行函数
     * @private 私有方法
     */
    _runTask() {
        // 若任务不为执行状态 或者 任务队列为空则直接返回
        // 若任务已经全部执行完毕则直接返回
        if (this.status !== STATUS_ONGOING || !this.taskQueue) {
            return
        }
        if (this.index === this.taskQueue.length) {
            this.dispose()
            return
        }
        // 取出当前待执行任务
        const task = this.taskQueue[this.index]
        // 区分任务类型
        if (task.taskType === TASK_SYNC) {
            // 执行同步任务
            this._syncTask(task)
        } else {
            // 执行异步任务
            this._asyncTask(task)
        }
    }

    /**
     * 同步任务执行函数
     * @param task 同步任务函数名
     * @private 私有方法
     */
    _syncTask(task) {
        // 定义在同步任务中的callback
        const next = (success) => {
            // 在同步任务中若success为false
            // 说明当前任务失败，直接抛出错误
            if (success){
                this._next(task)
            } else {
                throw new Error(this._errorMsg())
            }
        }

        // 开始执行
        const taskFn = task.taskFn
        taskFn(next)
    }

    /**
     * 异步任务执行函数
     * @param task 异步任务函数名
     * @private 私有方法
     */
    _asyncTask(task) {
        const self = this
        // 取出待执行的异步定时任务
        const taskFn = task.taskFn
        // 将时间轴上的回调定义为该异步任务
        this.timeLine.actionAfterFrame = function (time) {
            //定义异步任务完成后的callback
            function next() {
                self.timeLine.pause()
                self._next(task)
            }

            taskFn(next, time)
        }
        // 激活时间轴，异步任务开始定时回调
        this.timeLine.start()
    }

    /**
     * 推动任务队列的前进
     * @param task
     * @private 私有方法
     */
    _next(task) {
        const self = this
        // 任务索引+1
        this.index++

        // 任务是否设置了等待？
        // 若是，等待相应时常再执行
        // 这里一定要将_runTask封装在一个函数里,why?
        task.wait
            ? window.setTimeout(() => {
                this._runTask() }, task.wait)
            : this._runTask()
    }

    /**
     * 发生错误时的错误提示
     * @returns {string}
     * @private 私有方法
     */
    _errorMsg() {
        return `任务${self.index}执行失败，请根据任务队列${self.taskQueue}进行检查`
    }
}

export default DLAnimation
