<template>
    <view class="mask-container"
        :style="{ height: `${screenHeight - statusBarHeight}px`, top: `${statusBarHeight}px` }">
    </view>
</template>

<script setup>

import systemStore from '@/store/system'

const systemInfo = systemStore()
const { statusBarHeight, screenHeight } = systemInfo

</script>

<style lang="less" scoped>

.mask-container {
    position: fixed;
    width: 100vw;
    left: 0;
    background-color: var(--mask);
    z-index: 1;
}

</style>