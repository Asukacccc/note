<template>
    <scroll-view class="container" scroll-y :style="{ height: availableHeight + 'px', top: topBarHeight + 'px' }">
        <view :style="{ height: '4px', width: '100px' }"></view>
        <view :class="['image-intercept', displayCropContainer ? 'active' : '']">
            <view class="crop-container">
                <view class="image-display">
                    <image class="image" :src="imageSrc" mode="widthFix" v-if="displayCropContainer"></image>
                    <view class="test" @touchstart="startHandler($event, false)" @touchmove.prevent="moveHandler"
                        :style="{ top: top + 'px', left: left + 'px', width: width + 'px', height: height + 'px' }">
                        <view class="dot" v-for="(item, i) in dotPosition" :key="i" :data-position="item"
                            @touchstart.stop="startHandler($event, true)" @touchmove="moveHandler">
                        </view>
                    </view>
                </view>
            </view>
            <view class="confirm">
                <view class="update-button" :style="{ marginRight: buttonMarginRight + 'px' }" @click="interceptHandler">修改</view>
            </view>
            <view class="hidden-canvas">
                <canvas id="cropCanvas" type="2d" class="canvas"
                    :style="{ width: maxWidth + 'px', height: maxWidth * radio + 'px' }"></canvas>
            </view>
        </view>
    </scroll-view>
</template>

<script setup>
import { ref, useAttrs, getCurrentInstance, watch } from 'vue'
import systemStore from '../../store/system'

function startHandler({ changedTouches: touches }, flag) {
    if (touches.length > 1) return

    originLeft = left.value
    originTop = top.value
    originWidth = width.value
    originHeight = height.value
    originPageX = touches[0].pageX
    originPageY = touches[0].pageY
    isDot = flag
}

function moveHandler({ changedTouches: touches, target }) {
    if (touches.length > 1) return

    let spaceX
    let spaceY

    if (!isDot) {
        let tempTop,
            tempLeft,
            topOver = false,
            leftOver = false

        spaceX = touches[0].pageX - originPageX
        spaceY = touches[0].pageY - originPageY
        tempTop = originTop + spaceY
        tempLeft = originLeft + spaceX

        if (tempTop > maxHeight - height.value) {
            top.value = maxHeight - height.value
            topOver = true
        } else if (tempTop < 0) {
            top.value = 0
            topOver = true
        }

        if (tempLeft > maxWidth - width.value) {
            left.value = maxWidth - width.value
            leftOver = true
        } else if (tempLeft < 0) {
            left.value = 0
            leftOver = true
        }

        if (!topOver) top.value = tempTop

        if (!leftOver) left.value = tempLeft

        return
    }

    const vertical = target.dataset.position.split('-')[0]
    const horizontal = target.dataset.position.split('-')[1]

    function checkOverFlow(hasLongA = false, hasLongB = false) {
        let flag = hasLongB ? -1 : 1

        if (originWidth - spaceX * flag < minWidth) {
            spaceX = (originWidth - minWidth) * flag
            spaceY = spaceX * flag * radio.value * (spaceY > 0 ? 1 : -1)

            return
        }

        if (!hasLongA) {
            if (originTop + spaceY < 0) {
                spaceY = -originTop
                spaceX = originTop * (1 / radio.value) * (spaceX > 0 ? 1 : -1)
            }
        } else {
            if (originTop + originHeight + spaceY > maxHeight) {
                spaceY = maxHeight - originTop - originHeight
                spaceX = spaceY * (1 / radio.value) * (spaceX > 0 ? 1 : -1)
            }
        }

        if (!hasLongB) {
            if (originLeft + spaceX < 0) {
                spaceX = -originLeft
                spaceY = originLeft * radio.value * (spaceY > 0 ? 1 : -1)
            }
        } else {
            if (originLeft + spaceX + originWidth > maxWidth) {
                spaceX = maxWidth - originLeft - originWidth
                spaceY = spaceX * radio.value * (spaceY > 0 ? 1 : -1)
            }
        }
    }

    if (horizontal === 'middle' && vertical === 'top') {
        spaceY = touches[0].pageY - originPageY
        spaceX = Math.abs(spaceY * (1 / radio.value))
        spaceX *= touches[0].pageX - originPageX > 0 ? 1 : -1
    } else {
        spaceX = touches[0].pageX - originPageX
        spaceY = spaceX * radio.value
    }

    if (
        (horizontal === 'left' && vertical !== 'bottom') ||
        (horizontal === 'middle' &&
            vertical === 'top' &&
            spaceX > 0 &&
            spaceY > 0) ||
        (horizontal === 'middle' &&
            vertical === 'top' &&
            spaceX < 0 &&
            spaceY < 0)
    ) {
        checkOverFlow()
    } else if (horizontal === 'middle' && vertical === 'top') {
        checkOverFlow(false, true)
    } else if (horizontal === 'left' && vertical === 'bottom') {
        checkOverFlow(true, false)
    } else {
        checkOverFlow(true, true)
    }

    if (
        horizontal === 'left' ||
        (horizontal === 'middle' && vertical === 'top')
    ) {
        if (vertical !== 'bottom') {
            top.value = spaceY + originTop
        }
        spaceY *= -1
    }

    if (
        horizontal === 'left' ||
        (horizontal === 'middle' &&
            vertical === 'top' &&
            spaceX > 0 &&
            spaceY < 0) ||
        (horizontal === 'middle' &&
            vertical === 'top' &&
            spaceX < 0 &&
            spaceY > 0)
    ) {
        left.value = spaceX + originLeft
        spaceX *= -1
    }

    width.value = originWidth + spaceX
    height.value = originHeight + spaceY
}

function getOriginLength(imgWidth, imgHeight) {
    let tempWidth = imgWidth,
        tempHeight = imgWidth * radio.value

    if (tempHeight > imgHeight) {
        tempHeight = imgHeight
        tempWidth = tempHeight * (1 / radio.value)
    }

    width.value = tempWidth * 0.5
    height.value = tempHeight * 0.5
    left.value = imgWidth * 0.5 - width.value * 0.5
    top.value = imgHeight * 0.5 - height.value * 0.5
}

function imgLoadHandler() {
    let available = screenHeight - navigatorBarHeight - statusBarHeight
    let defaultOccupy = navigatorBarHeight + statusBarHeight

    topBarHeight.value = defaultOccupy
    availableHeight.value = available
}

function interceptHandler() {
    function uploadImageToServer(canvasInstance) {
        uni.canvasToTempFilePath({
            canvas: canvasInstance,
            success(res) {
                
                emit('getCropResult', res)
            }
        }, instance)
    }

    const query = uni.createSelectorQuery().in(instance)

    query.select('#cropCanvas').fields({ node: true, size: true })
    query.exec((res) => {
        const canvas = res[0].node
        const context = canvas.getContext('2d')
        const image = canvas.createImage()
        const canvasRadio = imageOriginWidth.value / maxWidth

        canvas.height = maxWidth * radio.value
        canvas.width = maxWidth
        image.src = imageSrc.value

        image.onload = () => {
            context.drawImage(
                image, left.value * canvasRadio, top.value * canvasRadio, width.value * canvasRadio, height.value * canvasRadio, 0, 0, maxWidth, maxWidth * radio.value
            )
            uploadImageToServer(canvas)
        }
    })
}

const dotPosition = [
    'top-left',
    'top-middle',
    'top-right',
    'middle-right',
    'bottom-right',
    'bottom-middle',
    'bottom-left',
    'middle-left'
]
const radio = ref(1)
const { screenHeight, navigatorBarHeight, statusBarHeight, screenWidth } = systemStore()
let maxHeight, maxWidth = screenWidth * 0.9 - 2
const top = ref(0),
    left = ref(0),
    width = ref(0),
    height = ref(0)
const minWidth = 50
let imageSrc = ref()
let imageOriginWidth = ref(0)
const instance = getCurrentInstance()
let originLeft, originTop, originWidth, originHeight, originPageX, originPageY
let isDot = false
const attrs = useAttrs()
const availableHeight = ref(0)
const topBarHeight = ref(navigatorBarHeight + statusBarHeight)
const backgroundDisplay = ref('')
const displayCropContainer = ref(false)
const emit = defineEmits(['getCropResult'])
const buttonMarginRight = 20 - screenWidth * 0.05

watch(() => attrs.src, () => {
    displayCropContainer.value = !!attrs.src
    imageOriginWidth.value = attrs.imageWidth

    backgroundDisplay.value = displayCropContainer.value ? 'true' : ''

    imageSrc.value = attrs.src
    radio.value = Number(attrs.cropRadio)

    if (!backgroundDisplay.value) return availableHeight.value = 0

    const imageRadio = attrs.imageRadio

    maxHeight = maxWidth / imageRadio
    getOriginLength(maxWidth, maxWidth / imageRadio)
    // 216由 css 而定，该数值为无图源下的高度
    // imgLoadHandler(216 + maxWidth / imageRadio)  
    imgLoadHandler()
})


</script>
<style lang="less" scoped>
.container {
    overflow: hidden;
    position: absolute;
    z-index: 10;
    width: 100vw;

    .image-intercept {
        // width: 340px;
        width: 90%;
        pointer-events: none;
        opacity: 0;
        transition: 0;
        transform: scale(10);
        position: relative;
        // padding-bottom: 42px;
        // padding-top: 46px;
        // margin: 0 auto 20px;
        margin: 0px auto 10px;
        overflow: hidden;

        .close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 20px;

            .close-icon {
                width: 100%;
                display: block;
            }
        }

        .title {
            margin: 0 auto 32px;
            font-size: 18px;
            font-weight: bold;
            color: #0d7377;
            position: relative;
            text-align: center;

            &::after {
                content: '';
                position: absolute;
                bottom: -12px;
                width: 50px;
                height: 3px;
                border: 5px;
                background-color: gray;
                left: 50%;
                transform: translate(-50%);
            }

            &::before {
                content: '';
                position: absolute;
                top: -12px;
                width: 50px;
                height: 3px;
                border: 5px;
                background-color: gray;
                left: 50%;
                transform: translate(-50%);
            }
        }

        .confirm {
            position: relative;
            overflow: hidden;

            .button {
                width: 80px;
                line-height: 30px;
                text-align: center;
                height: 30px;
                border: 1px solid #0d7377;
                color: #0d7377;
                float: right;
                margin-right: 10px;
                font-weight: bold;
            }

            .update-button {
                width: 60px;
                height: 30px;
                line-height: 30px;
                text-align: center;
                border-radius: 4px;
                background-color: var(--condition-background);
                color: var(--condition-text);
                float: right;
            }
        }

        .crop-container {
            position: relative;
            overflow: hidden;
            // width: 320px;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;

            .image-display {
                width: 100%;
                overflow: hidden;

                .image {
                    display: block;
                    width: 100%;
                }

                .test {
                    z-index: 1;
                    position: absolute;
                    border: 2px solid lightseagreen;

                    .dot {
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        opacity: 0.7;
                        border-radius: 50%;
                        background-color: gold;
                        transform: translate(-60%, -60%);

                        &:nth-child(1) {
                            top: 0;
                            left: 0;
                        }

                        &:nth-child(2) {
                            top: 0;
                            left: 50%;
                        }

                        &:nth-child(3) {
                            top: 0;
                            left: 100%;
                        }

                        &:nth-child(4) {
                            top: 50%;
                            left: 100%;
                        }

                        &:nth-child(5) {
                            top: 100%;
                            left: 100%;
                        }

                        &:nth-child(6) {
                            top: 100%;
                            left: 50%;
                        }

                        &:nth-child(7) {
                            top: 100%;
                            left: 0;
                        }

                        &:nth-child(8) {
                            top: 50%;
                            left: 0;
                        }
                    }
                }
            }
        }

        .hidden-canvas {
            height: 0;

            .canvas {
                position: absolute;
                opacity: 0;
                pointer-events: none;
                top: 0px;
                left: -2000px;
            }
        }
    }

    .active {
        pointer-events: auto;
        opacity: 1;
        transition: 0.3s;
        transform: scale(1);
        position: relative;
        background-color: white;
    }
}
</style>