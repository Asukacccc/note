<template>
    <view class="condition-container">
        <inner-nav-vue title="搜索条件"></inner-nav-vue>
        <view class="main-body">
            <view class="time">
                <picker @change="dateRoughChange" :range="dateRoughContent.range" :value="dateRoughContent.value">
                    <view class="total item">
                        <view class="name">日期定位</view>
                        <view class="value">{{ dateRoughContent.range[dateRoughContent.value] }}</view>
                    </view>
                </picker>
                <picker mode=date :start="startDate" :end="endDate" @change="startDateChange">
                    <view class="start item" v-if="dateDetailDisplay">
                        <view class="name">开始时间</view>
                        <view class="value">{{ startDateChoice || '未选择' }}</view>
                    </view>
                </picker>
                <picker mode="date" :start="startDate" :end="endDate" @change="endDateChange">
                    <view class="end item" v-if="dateDetailDisplay">
                        <view class="name">结束时间</view>
                        <view class="value">{{ endDateChoice || '未选择' }}</view>
                    </view>
                </picker>
            </view>
            <picker :range="noteTypeSelector.range" :value="noteTypeSelector.value" @change="noteTypeChange">
                <view class="type item">
                    <view class="name">笔记类型</view>
                    <view class="value">{{ noteTypeSelector.range[noteTypeSelector.value] }}
                    </view>
                </view>
            </picker>
            <picker :range="shareStateList.range" :value="2 - shareStateList.value" @change="shareStateChange">
                <view class="share item">
                    <view class="name">分享状态</view>
                    <view class="value">{{ shareStateList.range[2 - shareStateList.value] }}
                    </view>
                </view>
            </picker>

        </view>
    </view>
</template>

<script setup>

import innerNavVue from '../../../component/common/inner-nav.vue'
import { reactive, ref } from 'vue'
import showToast from '../../../utils/show-toast'
import search from '../../../store/search'
import { onUnload } from '@dcloudio/uni-app'

function shareStateChange(e) {
    shareStateList.value = 2 - e.detail.value
}

function secondsShiftStandard(seconds) {
    if (!seconds) return ''

    const endDate = new Date(seconds - 0)
    const year = endDate.getFullYear()
    const month = endDate.getMonth() + 1
    const day = endDate.getDate()

    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
}

function noteTypeChange(e) {
    noteTypeSelector.value = e.detail.value
}

function dateContract(isStart = true) {
    if (!startDateChoice.value || !endDateChoice.value) return

    const start = new Date(...startDateChoice.value.split('-').map(v => v - 0))
    const end = new Date(...endDateChoice.value.split('-').map(v => v - 0))

    if (start > end) {
        if (isStart) {
            startDateChoice.value = ''
        } else {
            endDateChoice.value = ''
        }

        showToast('开始时间不可大于结束时间')
    }
}

function startDateChange(e) {
    startDateChoice.value = e.detail.value
    dateContract()
}

function endDateChange(e) {
    endDateChoice.value = e.detail.value
    dateContract(false)
}

function dateRoughChange(e) {
    const choice = e.detail.value
    dateRoughContent.value = choice - 0

    if (choice - 0 === 3) {
        dateDetailDisplay.value = true
    } else {
        dateDetailDisplay.value = false
    }
}

const searchStore = search()
const dateRoughContent = reactive({
    range: ['全部', '本月', '近三个月', '自行定义'],
    value: searchStore.timeRoughChoice
})
const dateDetailDisplay = ref(searchStore.timeRoughChoice === 3)
const startDate = '2022-01-01'
const endDate = (function () {
    const current = new Date()
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const day = current.getDate()
    return `${year}-${month}-${day}`
})()
const startDateChoice = ref(secondsShiftStandard(searchStore.start))
const endDateChoice = ref(secondsShiftStandard(searchStore.end))
const noteTypeSelector = reactive({
    range: ['全部', '文本笔记', '思维导图'],
    value: searchStore.type
})
const shareStateList = reactive({
    range: ['全部', '已分享', '未分享'],
    value: searchStore.shareState
})

onUnload(() => {
    switch (dateRoughContent.value) {
        case 0: {
            if (searchStore.timeRoughChoice === 0) break

            searchStore.isChange = true
            searchStore.timeRoughChoice = 0
            searchStore.start = ''
            searchStore.end = ''
            break
        }
        case 1: {
            if (searchStore.timeRoughChoice === 1) break

            searchStore.originTimeSetRecord = startDateChoice.value
            searchStore.isChange = true
            searchStore.timeRoughChoice = 1
            const current = new Date()
            const target = new Date(current.getFullYear(), current.getMonth(), 1)
            const seconds = target.getTime()
            searchStore.start = seconds + ''
            searchStore.end = ''
            break
        }
        case 2: {
            if (searchStore.timeRoughChoice === 2) break

            searchStore.isChange = true
            searchStore.timeRoughChoice = 2
            const current = new Date()
            const year = current.getFullYear()
            const month = current.getMonth()
            let targetMonth = month - 3

            if (targetMonth < 0) {
                targetMonth = 13 + targetMonth
                year--
            }

            const target = new Date(year, targetMonth, 1)
            searchStore.start = target.getTime()
            searchStore.end = ''
            break
        }
        case 3: {
            const startSeconds = new Date(...startDateChoice.value.split('-').map((v, i) => i === 1 ? v - 1 : v - 0)).getTime() || ''
            const endSeconds = new Date(...endDateChoice.value.split('-').map((v, i) => i === 1 ? v - 1 : v - 0)).getTime() || ''
            searchStore.timeRoughChoice = 3
            searchStore.originTimeSetRecord = startDateChoice.value

            if (searchStore.start !== startSeconds) {
                searchStore.isChange = true
                searchStore.start = startSeconds
            }

            if (searchStore.end !== endSeconds) {
                searchStore.isChange = true
                searchStore.end = endSeconds + ''
            }

            break
        }
    }

    if (searchStore.type !== noteTypeSelector.value) {
        searchStore.type = noteTypeSelector.value
        searchStore.isChange = true
    }

    if (searchStore.shareState !== shareStateList.value) {
        searchStore.shareState = shareStateList.value
        searchStore.isChange = true
    }
})

</script>

<style scoped lang="less">
.condition-container {
    display: block;
    flex-direction: column;

    .main-body {
        .item {
            font-size: 14px;
            height: 40px;
            width: calc(100vw - 40px);
            margin: 10px auto 0;
            background-color: var(--box-background);
            border-radius: 4px;
            box-sizing: border-box;
            padding: 0 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #3490de;
            margin: 4px auto 0;

            .value {
                position: relative;
                margin-right: 18px;

                &::after {
                    content: '';
                    position: absolute;
                    right: -10px;
                    width: 10px;
                    height: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-top: 1px solid var(--text);
                    border-right: 1px solid var(--text);
                    transform: rotate(45deg) translateY(-75%);
                }
            }

            .name {
                color: var(--title);
            }
        }

        .type, .share {
            margin-top: 10px;
        }
    }
}
</style>