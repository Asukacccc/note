<template>
    <view class="write-container" @click="clickContainer">
        <view class="background" v-show="chooseShow">
            <mask-vue></mask-vue>
        </view>
        <view class="main-body">
            <view class="button">
                <image @click.stop="chooseWay" src="/static/write.png" class="write-img"></image>
                <view class="text-note note" v-show="chooseShow" @click="clickWriteWay(0)">创建文本笔记</view>
                <view class="map-note note" v-show="chooseShow" @click="clickWriteWay(1)">创建思维导图</view>
            </view>
        </view>
    </view>
</template>

<script setup>

import { ref } from 'vue'
import maskVue from '../common/mask.vue'

function clickContainer() {
    if (!chooseShow.value) return

    chooseShow.value = false
}

function clickWriteWay(type) {
    if (!type) {
        uni.navigateTo({ url: '/sub-package/write/text-note/text-note' })
    } else {
        uni.navigateTo({ url: '/sub-package/write/map-note/map-note' })
    }
}

function chooseWay() {
    chooseShow.value = true
}

const chooseShow = ref(false)

</script>

<style lang="less" scoped>
.write-container {
    position: relative;
    z-index: 1;

    .main-body {
        .button {
            width: 50px;
            height: 50px;
            position: fixed;
            right: 30px;
            bottom: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 1px 1px 2px 2px var(--map-background);
            background-color: white;
            border-radius: 50%;
            z-index: 1;

            .write-img {
                display: block;
                width: 30px;
                height: 30px;
            }

            .note {
                position: absolute;
                width: 120px;
                height: 30px;
                font-size: 14px;
                line-height: 30px;
                text-align: center;
                border-radius: 4px;
                right: 80px;
                top: 50%;
                transform-origin: 175px 0px;
                color: white;
                background-color: var(--condition-text);
            }

            .text-note {
                transform: rotate(25deg) translateY(-50%);
            }

            .map-note {
                transform: rotate(65deg) translateY(-50%);
            }
        }
    }
}
</style>