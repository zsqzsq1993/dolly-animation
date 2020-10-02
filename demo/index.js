import DollyAnimation from '../dist/dolly-animation.esm.js'

const rabbit1 = $('demo1')
const rabbit2 = $('demo2')

const imagesList = ['./images/rabbit-big.png','./images/rabbit-lose.png','./images/rabbit-win.png']

const rightRunningMap = ["0 -854", "-174 -852", "-349 -852", "-524 -852", "-698 -851", "-873 -848"];
const leftRunningMap = ["0 -373", "-175 -376", "-350 -377", "-524 -377", "-699 -377", "-873 -379"];
const rabbitWinMap = ["0 0", "-198 0", "-401 0", "-609 0", "-816 0", "0 -96", "-208 -97", "-415 -97", "-623 -97", "-831 -97", "0 -203", "-207 -203", "-415 -203", "-623 -203", "-831 -203", "0 -307", "-206 -307", "-414 -307", "-623 -307"];
const rabbitLoseMap = ["0 0", "-163 0", "-327 0", "-491 0", "-655 0", "-819 0", "0 -135", "-166 -135", "-333 -135", "-500 -135", "-668 -135", "-835 -135", "0 -262"];

repeatAndControl()
runAndWin()

function repeatAndControl() {
    const animation = new DollyAnimation(120)
    animation.loadImages(imagesList).changePosition(rabbit1, rightRunningMap, imagesList[0]).repeatForever()
    rabbit1.onmouseenter = function () {
        animation.pause()
    }
    rabbit1.onmouseleave = function () {
        animation.restart()
    }
    animation.start()
}

function runAndWin() {
    const interval = 200
    const len = rightRunningMap.length
    let right = true
    let toRightTime
    let left = 10

    const animation = new DollyAnimation(interval)

    animation.loadImages(imagesList)
             .customerFrame(taskFn)
             .changePosition(rabbit2, rabbitWinMap, imagesList[2])
             .wait(1000)
             .repeat(2)

    animation.start()

    function taskFn(next, time) {
        if (right) {
            const index = Math.min(time / interval | 0, len)
            if (index !== len) {
                const position = rightRunningMap[index-1].split(' ')
                rabbit2.style.backgroundImage = `url(${imagesList[0]})`
                rabbit2.style.backgroundPosition = `${position[0]}px ${position[1]}px`
                left += 20
                rabbit2.style.left  = `${left}px`
            } else {
                right = false
                toRightTime = time
            }
        } else {
            const index = Math.min((time - toRightTime) / interval | 0, len)
            if (index !== len) {
                const position = leftRunningMap[index-1].split(' ')
                rabbit2.style.backgroundImage = `url(${imagesList[0]})`
                rabbit2.style.backgroundPosition = `${position[0]}px ${position[1]}px`
                left -= 20
                rabbit2.style.left  = `${left}px`
            } else {
                right = true
                next(true)
            }
        }
    }
}

function $(className) {
    return document.getElementsByClassName(className)[0]
}

