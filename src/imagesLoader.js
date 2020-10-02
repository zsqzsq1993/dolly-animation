'use strict'

let _id = 0

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
    let count = 0
    // 超时timer的id，方便clear
    let timerId = 0
    // 图片全部成功加载的标志位
    let success = true
    // 是否超时的标志位
    let isTimeoOut = false

    // 考虑兼容数组、对象，for in 最合适
    // for of、for无法为对象进行遍历
    for (let key in imagesList) {
        // 排除原型上的属性
        if (!imagesList.hasOwnProperty(key)) {
            continue
        }
        let item = imagesList[key]
        // 对示例中的情形1、3进行转换
        if (typeof item === 'string') {
            // 对imagesList[key]重新赋值，
            // 将会在堆中进行改变，因为参数传递方式为"共享传递"
            item = imagesList[key] = {
                src: item
            }
        } else if (!item || !item.src) {
            // 排除不满足格式的图片集
            continue
        }

        // 创建Image的实例对象
        // 为何给window对象附上属性，存疑🤨
        item.id = `image_${key}_${getId()}`
        item.image = window[item.id] = new Image()

        load(item)
    }

    // 如果遍历完这个计数器为0
    // 说明imagesList完全不符合条件
    if (!count) {
        callback(false)
    }

    //设置延时计数器
    if (timeout) {
        let timerId = setTimeout(onTimeOut, timeout)
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
        const image = item.image
        // 计数器+1
        count++

        // 添加加载的标志位
        item.status = 'loading'

        // 添加onload事件和回调函数
        image.onload = () => {
            // 更新加载标志位
            item.status = 'loaded'
            // 成功加载后，需要
            // 更新加载成功标志位
            success = success && true

            done()
        }

        // 添加onerror事件和回调函数
        image.onerror = () => {
            // 更新加载标志位
            item.status = 'error'
            // 更新加载成功标志位
            success = success && false

            console.log(`loading image ${item.src} error.`)

            done()
        }

        // 发起http(s)请求,异步的
        image.src = item.src

        /**
         * 每个图片加载完后的回调
         * 无论加载成功失败都执行
         * 用于清理垃圾
         * 判断是否返回
         */
        function done() {
            // 方便垃圾回收
            image.onload = image.onerror = null

            // 存疑
            try{
                delete window[item.id]
            } catch (e) {

            }

            // 无论成功失败，都是完成了
            // 计数器-1
            count--
            // 返回的两个条件：
            // 1. 全部加载完（无论成功与否）
            // 2. onTimeOut
            if (!count && !isTimeoOut) {
                clearTimeout(timerId)
                callback(success)
            }
        }
    }

    /**
     * 发生timeout后的回调函数
     */
    function onTimeOut() {
        clearTimeout(timerId)
        isTimeoOut = true
        callback(false)
    }
}

export default imagesLoader
