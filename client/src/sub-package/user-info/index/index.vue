<template>
    <view class="me-container">
        <outer-nav-vue :list="topList" @iconClick="iconClick"></outer-nav-vue>
        <view class="main-body">
            <navigator hover-class="none" class="user-info item" url="/sub-package/user-info/info/info">
                <image src="/static/me.png" class="icon"></image>
                <view class="text">我的信息</view>
            </navigator>
            <navigator class="note-share item" hover-class="none" url="/sub-package/user-info/share/share">
                <image src="/static/share.png" class="icon"></image>
                <view class="text">我的分享</view>
            </navigator>
            <button open-type="share" class="mini-share item share-button" hover-class="none">
                <image src="/static/mini-share.png" class="icon"></image>
                <view class="text">分享小程序</view>
            </button>
        </view>
    </view>
</template>

<script setup>

import outerNavVue from '../../../component/common/outer-nav.vue'

function iconClick() {
    uni.navigateBack()
}

const topList = [{ id: 0, type: 'icon', src: '/static/home.png', link: 'not' },
{ id: 1, type: 'text', content: '我的' }]

</script>

<style lang="less" scoped>
.me-container {
    .main-body {
        .item {
            font-size: 14px;
            height: 40px;
            width: calc(100vw - 40px);
            margin: 10px auto 0;
            background-color: var(--shallow);
            border-radius: 4px;
            box-sizing: border-box;
            padding: 0 10px;
            display: flex;
            align-items: center;
            color: var(--color);
            margin: 10px auto 0;
            position: relative;

            &:first-child {
                margin: 20px auto 0;
            }

            &::after {
                content: '';
                position: absolute;
                right: 18px;
                width: 10px;
                height: 10px;
                top: 50%;
                transform: translateY(-50%);
                border-top: 1px solid var(--text);
                border-right: 1px solid var(--text);
                transform: rotate(45deg) translateY(-75%);
            }

            .icon {
                display: block;
                width: 20px;
                height: 20px;
                margin-right: 14px;
            }
        }

        .share-button {
            outline: none;
            border: none;
            font-size: 14px;

            &::after,
            &::before {
                display: none;
            }
        }
    }
}
</style>