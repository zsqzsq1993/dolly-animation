let _id = 0;

/**
 * 动态增加_id，保证多次调用imagesLoader，
 * 生成的图片对象的ID值也不会发生重复。
 * @returns {number}
 */
function getId() {
    return _id++
}

/**
 * 主函数
 * @param imagesList 图片集，接收数组或者对象
 * 接收以下的三种形式：
 * imagesList = [
 *      './image1.png',
 *      './image2.png'
 * ]
 * imagesList = {
 *     {src: './image1.png'},
 *     {src: './image2.png'}
 * }
 * imageList = {
 *     image1: './image1.png',
 *     image2: './image2.png'
 * }
 * @param timeout 超时时长，超过直接返回失败
 * @param callback 回调函数
 */
function imagesLoader(imagesList, callback, timeout) {
    // 计数器
    let count = 0;
    // 超时timer的id，方便clear
    let timerId = 0;
    // 图片全部成功加载的标志位
    let success = true;
    // 是否超时的标志位
    let isTimeoOut = false;

    // 考虑兼容数组、对象，for in 最合适
    // for of、for无法为对象进行遍历
    for (let key in imagesList) {
        // 排除原型上的属性
        if (!imagesList.hasOwnProperty(key)) {
            continue
        }
        let item = imagesList[key];
        // 对示例中的情形1、3进行转换
        if (typeof item === 'string') {
            // 对imagesList[key]重新赋值，
            // 将会在堆中进行改变，因为参数传递方式为"共享传递"
            item = imagesList[key] = {
                src: item
            };
        } else if (!item || !item.src) {
            // 排除不满足格式的图片集
            continue
        }

        // 创建Image的实例对象
        // 为何给window对象附上属性，存疑🤨
        item.id = `image_${key}_${getId()}`;
        item.image = window[item.id] = new Image();

        load(item);
    }

    // 如果遍历完这个计数器为0
    // 说明imagesList完全不符合条件
    if (!count) {
        callback(false);
    }

    //设置延时计数器
    if (timeout) {
        let timerId = setTimeout(onTimeOut, timeout);
    }

    /**
     * 加载每个图片对象的函数
     * 定义在imagesLoader内部
     * 方便享用其中的变量
     * 只有所有图片加载完后
     * 或是超时后才会返回
     * 若中途图片加载失败
     * 也要等所有图片加载完
     * 再统一返回
     * @param item 准备好的图片对象
     */
    function load(item) {
        const image = item.image;
        // 计数器+1
        count++;

        // 添加加载的标志位
        item.status = 'loading';

        // 添加onload事件和回调函数
        image.onload = () => {
            // 更新加载标志位
            item.status = 'loaded';
            // 成功加载后，需要
            // 更新加载成功标志位
            success = success && true;

            done();
        };

        // 添加onerror事件和回调函数
        image.onerror = () => {
            // 更新加载标志位
            item.status = 'error';
            // 更新加载成功标志位
            success = success && false;

            console.log(`loading image ${item.src} error.`);

            done();
        };

        // 发起http(s)请求,异步的
        image.src = item.src;

        /**
         * 每个图片加载完后的回调
         * 无论加载成功失败都执行
         * 用于清理垃圾
         * 判断是否返回
         */
        function done() {
            // 方便垃圾回收
            image.onload = image.onerror = null;

            // 存疑
            try{
                delete window[item.id];
            } catch (e) {

            }

            // 无论成功失败，都是完成了
            // 计数器-1
            count--;
            // 返回的两个条件：
            // 1. 全部加载完（无论成功与否）
            // 2. onTimeOut
            if (!count && !isTimeoOut) {
                clearTimeout(timerId);
                callback(success);
            }
        }
    }

    /**
     * 发生timeout后的回调函数
     */
    function onTimeOut() {
        clearTimeout(timerId);
        isTimeoOut = true;
        callback(false);
    }
}

// 时间轴状态常量
const STATUS_INITIAL = 0;
const STATUS_ONGOING = 1;
const STATUS_PAUSED = 2;

// 默认状态1s执行60帧动画
const DEFAULT_INTERVAL = 1000 / 60;

/**
 * 时间轴类
 */
class TimeLine {
    constructor(interval) {
        // 用户自定义时间间隔或默认值
        this.interval = interval;
        // 初始时间轴状态
        this.status = STATUS_INITIAL;
        // 用于记录timer的ID
        this.frameId = null;
        // 总体暂停时长
        this.totalPauseTime = 0;
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
        this.status = STATUS_ONGOING;

        // 设置动画的开始时间戳
        this.startTime = +new Date();
        this.totalPauseTime = 0;

        // +new Date(), new Date().getTime(), new Date().valueOf()相同
        this._startTimeline();
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
        this.status = STATUS_PAUSED;

        // 需要设置一个暂停时间戳
        this.pauseTime = +new Date();

        // 暂停
        cancelAnimationFrame(this.frameId);
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
        this.status = STATUS_ONGOING;

        // 计算暂停时间,并进行累加
        this.totalPauseTime += (+new Date() - this.pauseTime);

        // 重新激活时间戳
        this._startTimeline();
    }

    /**
     * 激活函数，激活时间轴
     * @param startTime 动画开始的时间（减去了暂停的时间）
     * @private 仅供内部调用
     */
    _startTimeline() {
        const self = this;
        let lastTick = +new Date();
        nextTick();

        function nextTick() {
            let nowTick = +new Date();

            // 异步调用
            self.frameId = _requestAnimationFrame(nextTick);

            // 如果累加的时间大于设定的interval
            // 执行自定义的回调并对时间戳进行更新
            if (nowTick - lastTick >= self.interval) {
                self.actionAfterFrame(nowTick - self.startTime - self.totalPauseTime);
                lastTick = nowTick;
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
})();

// 状态常量
const STATUS_INITIAL$1 = 0;
const STATUS_ONGOING$1 = 1;
const STATUS_PAUSED$1 = 2;

// 任务类型
const TASK_SYNC = 0;
const TASK_ASYNC = 1;

// 默认状态1s执行60帧动画
const DEFAULT_INTERVAL$1 = 1000 / 60;

/**
 * 动画类
 */
class DLAnimation {
    constructor(interval) {
        // 帧动画时间间隔
        this.interval = interval || DEFAULT_INTERVAL$1;
        // 任务队列
        this.taskQueue = [];
        // 初始状态
        this.status = STATUS_INITIAL$1;
        // 任务索引
        this.index = 0;
        // 初始化时间轴
        this.timeLine = new TimeLine(this.interval);
    }

    /**
     * 开始任务队列
     * @returns {Animation} 返回动画实例对象，方便链式调用
     */
    start() {
        // 如何不为初始状态则直接返回
        // 如果任务队列里没有任务直接返回
        if (this.status !== STATUS_INITIAL$1 || !this.taskQueue) {
            return this
        }

        // 修改为执行状态
        this.status = STATUS_ONGOING$1;
        this._runTask();
        return this
    }

    /**
     * 同步任务 - 暂停任务
     * @returns {Animation}
     */
    pause() {
        if (this.status === STATUS_ONGOING$1) {
            this.status = STATUS_PAUSED$1;
            this.timeLine.pause();
        }
        return this
    }

    /**
     * 同步任务 - 重启任务
     * @returns {Animation}
     */
    restart() {
        if (this.status === STATUS_PAUSED$1) {
            this.status = STATUS_ONGOING$1;
            this.timeLine.restart();
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
            imagesLoader(imagesList.slice(), next, timeout);
        };
        // 任务类型
        const taskType = TASK_SYNC;
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
        let taskFn, taskType;
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
                const length = positions.length;
                // 当前索引
                // 按位或，向下取整
                const index = Math.min(time / this.interval | 0, length);
                const position = positions[index - 1].split(' ');
                el.style.backgroundImage = `url(${imageUrl})`;
                el.style.backgroundPosition = `${position[0]}px ${position[1]}px`;

                // 完成条件
                if (index === length) {
                    // 执行回调，任务完成成功
                    next(true);
                }
            };
        } else {
            // 定义同步任务
            taskFn = function (next) {
                // 执行回调，任务完成失败
                next(false);
            };
        }
        taskType = TASK_ASYNC;

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
        let taskFn, taskType;
        if (urls) {
             taskFn = (next, time) => {
                 const length = urls.length;
                 const index = Math.min(time / this.interval | 0, length);
                 el.src = urls[index-1];

                 if (index === length) {
                    next(true);
                }
            };
        } else {
            taskFn = function (next) {
                next(false);
            };
        }
        taskType = TASK_ASYNC;

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
            this._addTask(taskFn, TASK_ASYNC);
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
            callback(this);
            next(true);
        };
        const taskType = TASK_SYNC;
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
                this.index -= steps || 1;
                this._runTask();
                // 这里一定需要一个return
                // 不然内存泄漏，原因不明
                return
            }
            // 这里运用了闭包
            // times在repeat执行完后不会被销毁
            // 若times减小至0后，进入下一个任务
            if (times) {
                this.index -= steps || 1;
                times--;
                this._runTask();
            } else {
                next(true);
            }
        };
        const taskType = TASK_SYNC;
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
            const length = this.taskQueue.length;
            this.taskQueue[length-1].wait = time;
        } else {
            throw new Error(this._errorMsg())
        }
        return this
    }

    dispose() {
        if (this.status !== STATUS_INITIAL$1) {
            this.status = STATUS_INITIAL$1;
            this.taskQueue = null;
            this.timeLine.pause();
            this.timeLine = null;
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
        });
        return this
    }

    /**
     * 任务执行函数
     * @private 私有方法
     */
    _runTask() {
        // 若任务不为执行状态 或者 任务队列为空则直接返回
        // 若任务已经全部执行完毕则直接返回
        if (this.status !== STATUS_ONGOING$1 || !this.taskQueue) {
            return
        }
        if (this.index === this.taskQueue.length) {
            this.dispose();
            return
        }
        // 取出当前待执行任务
        const task = this.taskQueue[this.index];
        // 区分任务类型
        if (task.taskType === TASK_SYNC) {
            // 执行同步任务
            this._syncTask(task);
        } else {
            // 执行异步任务
            this._asyncTask(task);
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
                this._next(task);
            } else {
                throw new Error(this._errorMsg())
            }
        };

        // 开始执行
        const taskFn = task.taskFn;
        taskFn(next);
    }

    /**
     * 异步任务执行函数
     * @param task 异步任务函数名
     * @private 私有方法
     */
    _asyncTask(task) {
        const self = this;
        // 取出待执行的异步定时任务
        const taskFn = task.taskFn;
        // 将时间轴上的回调定义为该异步任务
        this.timeLine.actionAfterFrame = function (time) {
            //定义异步任务完成后的callback
            function next() {
                self.timeLine.pause();
                self._next(task);
            }

            taskFn(next, time);
        };
        // 激活时间轴，异步任务开始定时回调
        this.timeLine.start();
    }

    /**
     * 推动任务队列的前进
     * @param task
     * @private 私有方法
     */
    _next(task) {
        // 任务索引+1
        this.index++;

        // 任务是否设置了等待？
        // 若是，等待相应时常再执行
        // 这里一定要将_runTask封装在一个函数里,why?
        task.wait
            ? window.setTimeout(() => {
                this._runTask(); }, task.wait)
            : this._runTask();
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

const DollyAnimation = DLAnimation;

export default DollyAnimation;
