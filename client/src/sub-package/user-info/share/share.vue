<template>
    <view class="share-container">
        <view class="navigator-bar" :style="{ height: `${navigatorBarHeight}px`, marginTop: `${statusBarHeight}px` }">
            <view class="back" @click="clickBackButton">
                <view class="arrow"></view>
            </view>
            <view class="caption">分享列表</view>
            <image class="search-icon" src="/static/search.png" :style="{ left: `${searchIconLeft}px` }" 
                @click="clickSearchIcon" >
            </image>
        </view>
        <view :style="{ height: `${navigatorBarHeight + statusBarHeight}px`, width: '10px' }"></view>
        <scroll-view class="main-body" scroll-y @scrolltolower="scrollToBottom" :enhanced="true" :show-scrollbar="false"
            :style="{ height: `${screenHeight - navigatorBarHeight - statusBarHeight}px` }">
            <view class="space" :style="{ height: '10px' }"></view>
            <view class="item" v-for="note in renderList" :key="note.id">
                <view class="left" @click="clickItem" :data-id="note.id">
                    <view class="tag">
                        <view :class="note.tag ? 'have' : 'none'" v-for="(v, i) in tagFilter(note.tag)" :key="i">
                            {{ v ? '#' + v : '无标签' }}
                        </view>
                    </view>
                    <view class="brief" v-if="note.brief">{{ note.brief }}</view>
                    <view class="title" v-else>{{ note.title }}</view>
                </view>
                <view class="right">
                    <image src="/static/http.png" mode="widthFix" class="link-icon" @click="copyLink"
                        :data-id="note.id"></image>
                    <view class="date">{{ dateFormat(note.shareDate) }}共享</view>
                </view>
            </view>
            <view class="space" :style="{ height: '50px' }"></view>
        </scroll-view>
    </view>
</template>

<script setup>

import systemStore from '../../../store/system'
import { getShareNoteListApi } from '../../../api/share'
import { reactive } from 'vue'
import dateConversion from '../../../utils/date-conversion'
import showToast from '../../../utils/show-toast'
import shareStore from '../../../store/share'
import { onShow } from '@dcloudio/uni-app'
import request from '../../../fly/index'
import searchStore from '../../../store/search'

function clickSearchIcon() {
    const search = searchStore()
    search.shareState = 1

    uni.navigateTo({
        url: '/sub-package/search/search/search?fromIndex=1'
    })
}

function copyLink(e) {
    const id = e.currentTarget.dataset.id

    uni.setClipboardData({
        data: `${request.config.baseURL}/mobile/share/${id}`,
        success() { showToast('已复制链接') }
    })
}

function clickItem(e) {
    const id = e.currentTarget.dataset.id - 0
    const { shareDate } = renderList.find(v => v.id === id)

    uni.navigateTo({
        url: `/sub-package/write/share/share?id=${id}&shareDate=${shareDate}`
    })
}

function clickBackButton() {
    uni.navigateBack()
}

function scrollToBottom() {
    getShareList(false)
}

function dateFormat(date) {
    const conversion = dateConversion(date)
    return conversion[0] + '' + conversion[1]
}

function tagFilter(tag) {
    return tag.split(' ')
}

async function getShareList(isFirst) {
    let requestMinTime = ''
    let requestLength = maxLength

    if (isListOver) return
    if (!isFirst) {
        requestMinTime = renderList[renderList.length - 1].shareDate
        requestLength = 10
    }

    const requestResult = await getShareNoteListApi(requestMinTime, requestLength)
    if (!requestResult) return

    renderList.push(...requestResult.message)

    if (requestResult.message.length < requestLength) {
        isListOver = true
        showToast('已加载完成')
    }
}

const { navigatorBarHeight, statusBarHeight, screenWidth, screenHeight } = systemStore()
const { left: menuBtnLeft } = uni.getMenuButtonBoundingClientRect()
const searchIconLeft = screenWidth - (screenWidth - menuBtnLeft) - 20 - 20
const maxLength = Math.floor((screenHeight - navigatorBarHeight - statusBarHeight) / 70) + 1
let isListOver = false
const renderList = reactive([])
const share = shareStore()

getShareList(true)

onShow(() => {
    if (share.isDelete) {
        share.isDelete = false

        const index = renderList.findIndex(v => v.id === share.noteId)

        renderList.splice(index, 1)
    }
})

</script>

<style lang="less" scoped>
.share-container {
    display: flex;
    flex-direction: column;
    height: 100vh;

    .navigator-bar {
        position: fixed;
        width: 100vw;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        padding-left: 24px;

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

        .search-icon {
            display: block;
            width: 20px;
            height: 20px;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
        }
    }

    .main-body {
        .item {
            height: 60px;
            width: calc(100vw - 30px);
            margin: 10px auto;
            background-color: var(--box-background);
            display: flex;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 6px 12px;
            border-radius: 4px;

            .left {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                flex: 1;
                width: 0;

                .tag {
                    font-weight: bold;
                    font-size: 14px;
                    display: flex;
                    width: 100%;
                    overflow: hidden;

                    .have {
                        background-color: var(--map-background);
                        color: var(--title);
                        padding: 2px 6px;
                        margin-right: 2px;
                        border-radius: 2px;
                        flex-shrink: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .none {
                        opacity: .6;
                        color: var(--title);
                    }
                }

                .title,
                .brief {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 12px;
                }

                .title {
                    font-weight: bold;
                }
            }

            .right {
                position: relative;
                width: max-content;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                justify-content: space-between;
                margin-left: 20px;

                .link-icon {
                    display: block;
                    width: 40px;
                }

                .date {
                    font-size: 10px;
                    color: var(--text);
                    white-space: nowrap;
                    text-align: right;
                }
            }
        }
    }
}
</style>