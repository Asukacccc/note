<template></template>

<style lang="less">
page {
    --title: #171717;
    --text: #707077;
    --mask: rgba(212, 212, 212, .4);
    --map-background: rgba(112, 112, 112, .2);
    --unique: #4686F7;
    --condition-text: #165E9A;
    --condition-background: #85BBF2;
    --line: rgba(112, 112, 112, .4);
    --background-color: #fdfdfd;
    --box-background: rgba(150, 150, 150, .1);
    --link-color: #00bbf0;
    --shallow: #F1F1F1;
    --blue: #165E9A;

    width: 100%;
    height: 100%;
    background-color: var(--background-color);
}

@media (prefers-color-scheme: dark) {
    page {
        --title: #B2B2B2;
        --text: #9A9A9A;
        --mask: rgba(94, 94, 94, .4);
        --map-background: rgba(195, 183, 183, .2);
        --line: rgba(154, 154, 154, .4);
        --background-color: #343434;
        --box-background: rgba(154, 154, 154, .1);
        --shallow: #444444;
        --blue: #00bbf0;

        background-color: var(--background-color);
    }
}
</style>

<script setup>

import SystemStore from '@/store/system.js'
import { onLaunch } from '@dcloudio/uni-app'

const systemInfo = uni.getSystemInfoSync()
const systemStore = SystemStore()
const { top, height } = uni.getMenuButtonBoundingClientRect()

systemStore.$patch((state) => {
    state.screenWidth = systemInfo.windowWidth
    state.screenHeight = systemInfo.windowHeight
    state.statusBarHeight = systemInfo.statusBarHeight
    state.navigatorBarHeight = (top - systemInfo.statusBarHeight) * 2 + height
    state.availableHeight = state.screenHeight - (state.navigatorBarHeight + state.statusBarHeight)
    state.darkMode = systemInfo.theme === 'dark'
    state.isIOS = systemInfo.platform === 'ios'
})

uni.onThemeChange((res) => {
    systemInfo.darkMode = res.theme === 'dark'
})

uni.onAppRoute(res => {
    uni.setStorageSync('path', res.path)
})

onLaunch(() => {
    const isLoaded = uni.getStorageSync('loaded')

    if (isLoaded) {
        const path = uni.getStorageSync('path')

        if (path.indexOf('index/index') !== -1) return

        if (path.indexOf('text-note') !== -1 || path.indexOf('map-note') !== -1) {
            const totalPath = `/${path}?loadType=1`

            uni.navigateTo({ url: totalPath })
        }
    }
})

</script>