<template>
    <view class="inner-container" :style="{ height: `${statusBarHeight + navigatorBarHeight}px` }">
        <view class="content" :style="{ height: `${navigatorBarHeight}px`, marginTop: `${statusBarHeight}px` }">
            <view class="back" @click="back">
                <view class="arrow"></view>
            </view>
            <view class="caption">{{ title || 'test' }}</view>
        </view>
    </view>
    <view class="space" :style="{ height: `${statusBarHeight + navigatorBarHeight}px` }"></view>
</template>

<script setup>

import SystemStore from '../../store/system'
import { toRefs } from 'vue'

function back() {
    if (isInterceptBack.value) return emit('clickBackButton')
    uni.navigateBack()
}

const systemInfo = SystemStore()
const { statusBarHeight, navigatorBarHeight } = systemInfo
const props = defineProps(['title', 'isInterceptBack'])
const { title, isInterceptBack } = toRefs(props)
const emit = defineEmits(['clickBackButton'])

</script>

<style scoped lang="less">
.inner-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;

    .content {
        display: flex;
        align-items: center;
        margin-left: 24px;

        .back {
            margin-right: 14px;

            .arrow {
                border-top: 1px solid var(--title);
                border-left: 1px solid var(--title);
                transform: rotate(-45deg);
                width: 12px;
                height: 12px;
            }
        }

        .caption {
            font-size: 14px;
        }
    }
}
</style>