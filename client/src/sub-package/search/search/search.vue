<template>
    <confirm-vue title="是否删除当前笔记" :display="confirmBoxDisplay" @confirmResult="confirmResult"></confirm-vue>
    <view class="search-container" :style="{ paddingTop: `${ statusBarHeight }px` }">
        <view class="search" :style="{ height: `${ navigatorBarHeight }px` }">
            <view class="back" @click="back">
                <view class="arrow"></view>
            </view>
            <input type="text" class="search-input" :style="{ width: `${ searchBoxWidth }` }" @input="searchInput"
                placeholder="搜索标签, 标题, 简要等" confirm-type="search" @confirm="searchConfirm" :value="inputBoxValue">
        </view>
        <view class="result-condition">
            <view class="result">
                <text v-show="!historyListShow">查到了 <text :style="{ fontWeight: 'bold' }">{{ resultList.length }}
                        {{ !isOver && !currentRangeOver ? '+' : '' }}</text> 条笔记</text>
                <text v-show="historyListShow">历史记录</text>
            </view>
            <view @click="selectRange" class="condition">{{ isSetRange ? '已指定范围' : '指定范围' }}</view>
        </view>
        <scroll-view class="scroll-view" scroll-y enable-flex :style="{ height: `${ scrollViewHeight }px` }" enhanced
            :show-scrollbar="false" lower-threshold="30" @scrolltolower="scrollToLower" :scroll-top="scrollTop">
            <view class="space" :style="{ height: '10px', width: '100%' }"></view>
            <view class="note" v-if="!historyListShow">
                <view class="item" v-for="(v, i) in resultList" :key="v.id">
                    <view class="left-part" @click="clickItem" :data-id="v.id">
                        <view class="tag">
                            <view :class="[v ? 'have' : 'none']" v-for="(v, i) in getTags(v.tag)" :key="i">{{ v ? '#' +
                            v : '无标签' }}</view>
                        </view>
                        <view :class="v.brief ? 'brief' : 'title'">{{ v.brief ? v.brief : v.title }}</view>
                    </view>
                    <view class="right-part">
                        <view class="more-choose" v-if="isFromIndexPage" @click="recordId" :data-id="v.id">
                            <text :id="`a${ v.id }`" @click="clickMore">...</text>
                            <more-vue :display="moreShow[`a${ v.id }`]" :list="moreListContent" :top="topDistance"
                                :left="leftDistance" @closeMoreShow="closeMoreShow" @execute="executeMore"></more-vue>
                        </view>
                        <image class="copy-icon" v-else src="/static/copy.png" @click="getNoteLinkId(v.id)"></image>
                    </view>
                </view>
            </view>
            <view class="history-item" v-else>
                <view class="text" v-for="(v, i) in localHistory" :key="v.id" @click="clickHistory"
                    :data-content="v.content">{{ v.content }}</view>
                <view class="clear-history" @click="clearHistory">清除历史</view>
            </view>
            <view class="space" :style="{ height: '50px', width: '100%' }"></view>
        </scroll-view>
    </view>
</template>

<script setup>

import system from '../../../store/system'
import { storeToRefs } from 'pinia'
import note from '../../../store/note'
import { onShow, onLoad, onUnload } from '@dcloudio/uni-app'
import { computed, ref, getCurrentInstance, reactive } from 'vue'
import search from '../../../store/search'
import { searchTagTitleBrief } from '../../../api/search'
import moreVue from '../../../component/common/more.vue'
import link from '../../../store/link'
import { deleteNoteAPi, getNotePartInfo } from '../../../api/note'
import showToast from '../../../utils/show-toast'
import confirmVue from '../../../component/common/confirm.vue'
import shareStore from '../../../store/share'

async function confirmResult(flag) {
    if (flag) {
        let item = await getItemInfo(prepHandlerId)
        let inList = !!item

        const { textLink, title } = item
        const deleteResult = await deleteNoteAPi({ link: textLink, isTextNote: title ? '0' : '1' })

        if (!deleteResult) return showToast('出错了')
        else {
            if (inList) {
                list.value = list.value.filter(v => v.id !== prepHandlerId)
            }
            resultList.value = resultList.value.filter(v => v.id !== prepHandlerId)
        }

    }

    confirmBoxDisplay.value = false
}

async function clickItem(e) {
    const id = e.currentTarget.dataset.id
    const item = await getItemInfo(id)

    const { title, tag, textLink, shareDate, updateTime } = item

    if (title) {
        uni.navigateTo({
            url:
                `/sub-package/write/map-note/map-note?loadType=0&id=${id}&title=${title}&tag=${tag}&textLink=${textLink}&shareDate=${shareDate}&updateTime=${updateTime}`
        })
    } else {
        uni.navigateTo({
            url:
                `/sub-package/write/text-note/text-note?loadType=0&id=${id}&tag=${tag}&textLink=${textLink}&shareDate=${shareDate}&updateTime=${updateTime}`
        })
    }
}

async function getItemInfo(id) {
    let item = list.value.find(v => v.id === id)

    if (!item) {
        const info = await getNotePartInfo(id)

        if (!info) return showToast('出错了')

        item = info.message
    }

    return item
}

function recordId(e) {
    const id = e.currentTarget.dataset.id

    prepHandlerId = id
}

function shareHandler() {
    const item = resultList.value.find(v => v.id === prepHandlerId)
    uni.navigateTo({
        url: `/sub-package/write/share/share?id=${prepHandlerId}&shareDate=${item.shareDate}`
    })
}

function deleteHandler() {
    confirmBoxDisplay.value = true
}

function getNoteLinkId(id) {
    link().linkId = id
    uni.navigateBack()
}

function clickMore(e) {
    const id = e.target.id
    clickMoreId = id

    uni.createSelectorQuery().in(instance).select(`#${id}`).boundingClientRect(res => {
        topDistance.value = res.top
        leftDistance.value = res.left - 14
        moreShow[id] = true
    }).exec()
}

function closeMoreShow() {
    moreShow[clickMoreId] = false
}

function executeMore(id) {
    moreExecFuncs[id]()
}

function clickHistory(e) {
    const content = e.currentTarget.dataset.content
    inputBoxValue.value = content
}

function scrollToLower(e, length = 10) {
    if (currentRangeOver.value || isOver.value) return

    searchNote(lastSearchContent, length, false)
}

function searchInput(e) {
    const { value } = e.detail

    if (value === '') {
        historyListShow.value = true
    }
}

function selectItem(array) {
    const startTime = searchStore.start || 0
    const endTime = searchStore.end || '9'.repeat(13)
    const noteType = searchStore.type - 0
    const shareState = searchStore.shareState

    array = array.filter(v => {
        const startCheck = v.updateTime >= startTime
        const endCheck = v.updateTime <= endTime
        const typeCheck = (function () {
            if (noteType === 0) return true
            else if (noteType === 1) return v.title === ''
            else return v.brief === ''
        })()
        const shareCheck = (function () {
            if (shareState === 2) return true
            else if (shareState === 1) return v.shareDate > '0'
            else return v.shareDate === '0'
        })()

        return startCheck && endCheck && typeCheck && shareCheck
    })

    return array
}

function filterList(array, findContent) {
    if (array.length) {
        return array.filter(v => {
            const tagFind = v.tag.indexOf(findContent) !== -1
            const titleFind = v.title.indexOf(findContent) !== -1
            const briefFind = v.brief.indexOf(findContent) !== -1

            if (tagFind || titleFind || briefFind) return true
        })
    } else {
        return []
    }
}

async function searchNote(content, length, isFirst) {
    let requestList = []

    if (!isOver.value) {
        const { message } = await searchTagTitleBrief(content, length)

        if (message.length < length) {
            currentRangeOver.value = true
        }

        requestList = message
    }

    resultList.value = [...resultList.value, ...requestList]

    if (!requestList.length) return

    searchStore.lastId = resultList.value[resultList.value.length - 1].id
}

function clearHistory() {
    localHistory.value = []
    uni.setStorageSync('history', [])
}

function getMinId(array) {
    if (!array.length) return 0

    let minId = array[0].id

    for (let i of array) {
        if (i.id < minId) minId = i.id
    }

    return minId
}

function searchConfirm(e) {
    const searchContent = e.detail.value

    if (searchContent.trim() === '') return

    historyListShow.value = false

    if (lastSearchContent === searchContent && !searchStore.isChange) {
        return
    } else {
        currentRangeOver.value = false
        lastSearchContent = searchContent
        resultList.value = filterList(list.value, searchContent)
        resultList.value = selectItem(resultList.value)
        searchStore.lastId = getMinId(list.value)
    }

    if (!localHistory.value) {
        localHistory.value = [{ id: 0, content: searchContent }]
    } else {
        localHistory.value = localHistory.value.filter(v => v.content !== searchContent)

        localHistory.value.unshift({ id: localStorageId++, content: searchContent })
    }

    uni.setStorageSync('history', localHistory.value)

    searchNote(searchContent, maxLength, true)
}

function selectRange() {
    uni.navigateTo({ url: '/sub-package/search/condition/condition' })
}

function getTags(tagStr) {
    return tagStr.split(' ')
}

function back() {
    uni.navigateBack()
}

const { statusBarHeight, navigatorBarHeight, screenWidth, screenHeight } = storeToRefs(system())
const { left } = uni.getMenuButtonBoundingClientRect()
const searchBoxWidth = `${screenWidth.value - (screenWidth.value - left) - 30 - 24 - 14 - 12}px`
const scrollViewHeight = `${screenHeight.value - navigatorBarHeight.value - statusBarHeight.value - 44}`
const { list, isOver } = storeToRefs(note())
const isFromIndexPage = ref(0)
const searchStore = search()
const maxLength = Math.floor(screenHeight.value / (58 + 14)) + 1
const localHistory = ref([])
const isSetRange = computed(() => {
    return searchStore.timeRoughChoice !== 0 && searchStore.start !== '' && searchStore.end !== '' || searchStore.type !== 0 || searchStore.shareState !== 2
})
let localStorageId, lastSearchContent = ''
const currentRangeOver = ref(false)
const resultList = ref(list.value)
const historyListShow = ref(true)
const inputBoxValue = ref('')
const scrollTop = ref(0)
const moreShow = reactive({})
const moreListContent = [
    { id: 0, name: '分享' },
    { id: 1, name: '删除', important: true }
]
const topDistance = ref(0)
const leftDistance = ref(0)
let clickMoreId
const instance = getCurrentInstance()
const moreExecFuncs = [
    shareHandler, deleteHandler
]
let prepHandlerId = 0
const confirmBoxDisplay = ref(false)

isOver.value = !list.value.length

onLoad(options => {
    isFromIndexPage.value = !!(options.fromIndex - 0)
})

onUnload(() => {
    uni.setStorageSync('storageId', localStorageId)
    searchStore.$reset()
})

localHistory.value = uni.getStorageSync('history')

if (!(localStorageId = uni.getStorageSync('storageId'))) {
    uni.setStorageSync('storageId', 0)

    localStorageId = 1
}

onShow(() => {
    const share = shareStore()

    if (searchStore.isChange && !historyListShow.value && list.value.length) {

        resultList.value = selectItem(list.value)
        searchStore.isChange = false
        currentRangeOver.value = false
        searchStore.lastId = getMinId(list.value)
        scrollTop.value = Math.random()

        if (resultList.value.length < maxLength) {
            scrollToLower('', maxLength - resultList.value.length)
        }
    }

    if (share.isDelete) {
        share.isDelete = false
        const item = resultList.value.find(v => v.id === share.noteId)
        item['shareDate'] = ''

        if (searchStore.shareState === 1) {
            resultList.value = resultList.value.filter(v => v.id !== share.noteId)
        }
    }

    share.openShareDate && (share.openShareDate = '')
})

</script>

<style lang="less" scoped>
.search-container {
    height: 100vh;
    box-sizing: border-box;
    width: calc(100vw - 48px);
    margin: 0 auto;

    .search {
        display: flex;
        align-items: center;

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

        .search-input {
            height: 80%;
            background-color: var(--map-background);
            color: var(--title);
            border-radius: 4px;
            padding-left: 10px;
            font-size: 14px;
        }
    }

    .result-condition {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        height: 40px;
        align-items: center;
        margin-bottom: 4px;

        .condition {
            background-color: var(--condition-background);
            color: var(--condition-text);
            height: 26px;
            padding: 0 12px;
            line-height: 26px;
            border-radius: 4px;
        }
    }

    .scroll-view {
        width: calc(100vw - 20px);
        position: relative;
        right: 14px;

        .note {
            width: 100%;

            .item {
                width: calc(100% - 10px);
                margin: 0 auto 14px;
                height: 58px;
                border-radius: 4px;
                box-shadow: 0px 0px 4px var(--line);
                display: flex;
                justify-content: space-between;
                box-sizing: border-box;
                padding: 6px 10px;

                .left-part {
                    width: 0;
                    flex-shrink: 0;
                    flex: 1;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;

                    .tag,
                    .brief,
                    .title {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-size: 12px;
                    }

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
                        }

                        .none {
                            opacity: .6;
                            color: var(--title);
                        }
                    }

                    .title {
                        font-weight: bold;
                    }
                }

                .right-part {
                    flex-shrink: 0;
                    height: 100%;
                    width: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;

                    .more-choose {
                        font-size: 18px;
                        font-weight: bold;
                        width: 30px;
                        height: 30px;
                        line-height: 30px;
                        text-align: right;
                        position: relative;
                        bottom: 4px;
                    }

                    .copy-icon {
                        width: 24px;
                        height: 24px;
                        display: block;
                    }
                }
            }
        }

        .history-item {
            width: 100%;
            display: flex;
            flex-wrap: wrap;

            .text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                box-sizing: border-box;
                max-width: 100%;
                flex-shrink: 0;
                padding: 2px 10px;
                border-radius: 4px;
                margin-right: 4px;
                margin-bottom: 6px;
                background-color: var(--map-background);
                color: var(--text);
            }

            .clear-history {
                margin-top: 12px;
                color: var(--blue);
                width: 100%;
                font-size: 12px;
            }

        }
    }
}
</style>