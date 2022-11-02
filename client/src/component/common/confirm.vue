<template>
    <view class="confirm-container" v-show="display">
        <mask-vue></mask-vue>
        <view class="content">
            <view class="title">{{ title }}</view>
            <view class="choose">
                <view class="cancel item" @click="choose(false)">取消</view>
                <view class="middle"></view>
                <view class="confirm item" @click="choose(true)">确认</view>
            </view>
        </view>
    </view>
</template>

<script setup>

import maskVue from './mask.vue'
import { useAttrs, toRefs } from 'vue'

function choose(flag) {
    emits('confirmResult', flag)
}

const attrs = useAttrs()
const { title, display } = toRefs(attrs)
const emits = defineEmits(['confirmResult'])

</script>

<style lang="less" scoped>
.confirm-container {
    position: fixed;
    z-index: 3;
    .content {
        background-color: var(--background-color);
        width: 240px;
        height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        align-items: center;
        border-radius: 4px;
        box-shadow: 2px 2px 10px 0 var(--line);
        z-index: 1;
        color: var(--title);

        .title {
            height: 60%;
            font-weight: bold;
            font-size: 16px;
            line-height: 72px;
        }

        .choose {
            display: flex;
            width: 70%;
            flex: 1;
            align-items: center;
            justify-content: space-between;

            .middle {
                height: 10px;
                width: 1px;
                background-color: var(--line);
            }

            .item {
                font-weight: 14px;
                position: relative;

                &:hover {
                    &::after {
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: -1;
                        width: 100px;
                        height: 40px;
                        background-color: var(--map-background);
                        content: '';
                        filter: blur(10px);
                    }
                }
            }

            .confirm {
                color: red;
            }
        }
    }
}
</style>