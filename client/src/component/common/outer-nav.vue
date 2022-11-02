<template>
    <view class="outer-container" :style="{ height: `${navigatorBarHeight + statusBarHeight}px` }" @click="test">
        <view class="button-title" :style="{ height: `${navigatorBarHeight}px` }">
            <view class="item" v-for="v in list" :key="v.id">
                <navigator @click="iconClickHandler(v.link)" class="button" hover-class="none" v-if="v.type === 'icon'" :url="v.link">
                    <image class="btn-img" :src="v.src"></image>
                </navigator>
                <view class="title" :style="{ width: `${screenWidth - (screenWidth - left) - 58}px` }" v-else>{{ v.content }}</view>
            </view>
        </view>
    </view>
    <view class="space" :style="{ height: `${navigatorBarHeight + statusBarHeight}px` }"></view>
</template>

<script setup>

import SystemStore from '@/store/system'
import { useAttrs, toRef } from 'vue'

function iconClickHandler(link) {
    if (link !== 'not') return

    emits('iconClick')
}

const systemInfo = SystemStore()
const { statusBarHeight, navigatorBarHeight, screenWidth } = systemInfo
const attrs = useAttrs()
const { left } = uni.getMenuButtonBoundingClientRect()
const list = toRef(attrs, 'list')
const emits = defineEmits(['iconClick'])

</script>

<style scoped lang="less">
.outer-container {
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    display: flex;
    z-index: 1;

    .button-title {
        align-self: flex-end;
        display:  flex;
        justify-items: center;
        align-items: center;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        padding-left: 20px;

        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 20px;
            height: 1px;
            background-color: var(--text);
            width: 150px;
        }

        .item {
            margin-right: 20px;
            .button {
                .btn-img {
                    width: 18px;
                    height: 18px;
                    display: block;
                }
            }

            .title {
                font-size: 18px;
                color: var(--title);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}
</style>

