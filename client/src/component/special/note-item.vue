<template>
    <confirm-vue title="是否删除当前笔记" :display="confirmBoxDisplay" @confirmResult="confirmResult"></confirm-vue>
    <view :class="['note-container', over ? 'hidden-container-distance' : '']">
        <view class="main">
            <view class="info">
                <view :class="['date-time', over ? 'hidden-item' : '']">
                    <view class="date" v-if="displayTime[0]">{{ displayTime[0] }}</view>
                    <view class="time">{{ displayTime[1] }}</view>
                </view>
                <view class="dot"></view>
            </view>
            <view class="content" @click="clickItem">
                <view class="tag" v-if="!over">
                    <view :class="v ? 'have': 'none'" v-for="(v, i) in tagArray(tag)" :key="i">{{ v ? '#' + v : '无标签' }}
                    </view>
                </view>
                <view class="brief" v-if="brief">{{ brief }}</view>
                <view class="title" v-else>{{ title }}</view>
            </view>
        </view>
        <view :class="['more', over ? 'hidden-item' : '']">
            <view class="button" @click="chooseMore">...</view>
            <more-vue :display="moreShow" :list="moreListContent" :top="topDistance" :left="leftDistance"
                @closeMoreShow="closeMoreShow" @execute="executeMore"></more-vue>
        </view>
    </view>
</template>

<script setup>

import { toRefs, ref, getCurrentInstance, computed } from 'vue'
import timeFormat from '../../utils/date-conversion'
import moreVue from '../common/more.vue'
import noteStore from '../../store/note'
import { deleteNoteAPi } from '../../api/note'
import confirmVue from '../common/confirm.vue'

async function confirmResult(flag) {
    if (flag) {
        const deleteResult = await deleteNoteAPi({ isTextNote: title.value ? '0' : '1', link: textLink.value })

        if (!deleteResult) return
        note.list = note.list.filter(v => v.id !== noteId.value)
    }

    confirmBoxDisplay.value = false
}

function clickItem() {
    if (title.value) {
        uni.navigateTo({
            url:
                `/sub-package/write/map-note/map-note?loadType=0&id=${noteId.value}&title=${title.value}&tag=${tag.value}&textLink=${textLink.value}&updateTime=${date.value}&shareDate=${shareDate.value}`
        })
    } else {
        uni.navigateTo({
            url:
                `/sub-package/write/text-note/text-note?loadType=0&id=${noteId.value}&tag=${tag.value}&textLink=${textLink.value}&updateTime=${date.value}&shareDate=${shareDate.value}`
        })
    }
}

function tagArray(tags) {
    return tags.split(' ')
}

function shareNote() {
    uni.navigateTo({
        url: `/sub-package/write/share/share?id=${noteId.value}&shareDate=${shareDate.value}`
    })
}

function deleteNote() {
    confirmBoxDisplay.value = true
}

function executeMore(id) {
    operationList[id]()
}

function closeMoreShow() {
    moreShow.value = false
}

function chooseMore() {
    query.select('.button').boundingClientRect(res => {
        leftDistance.value = res.left
        topDistance.value = res.top
        moreShow.value = true
    }).exec()
}

const props = defineProps(['date', 'tag', 'brief', 'title', 'noteId', 'over', 'textLink', 'shareDate'])
const { date, tag, brief, title, over, noteId, textLink, shareDate } = toRefs(props)
const displayTime = computed(() => over.value ? '' : timeFormat(date.value))
const moreShow = ref(false)
const moreListContent = [
    { id: 0, name: '分享' },
    { id: 1, name: '删除', important: true }
]
const operationList = [shareNote, deleteNote]
const leftDistance = ref(0)
const topDistance = ref(0)
const instance = getCurrentInstance()
const query = uni.createSelectorQuery().in(instance)
const note = noteStore()
const confirmBoxDisplay = ref(false)

</script>

<style lang="less" scoped>
.note-container {
    display: flex;
    font-size: 12px;
    margin-bottom: 30px;

    .main {
        flex: 1;
        display: flex;

        .info {
            display: flex;
            align-items: center;
            margin-right: 14px;

            .date-time {
                width: 63.5px;
                box-sizing: border-box;
                padding-right: 6px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;

                .date {
                    font-size: 10px;
                    margin-bottom: 4px;
                }

                .time {
                    font-weight: bold;
                }
            }
        }

        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 42px;
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
            }

            .title {
                font-weight: bold;
            }

            .brief {
                font-size: 12px;
            }
        }

        .dot {
            width: 14px;
            height: 14px;
            position: relative;
            transform: rotate(45deg);

            &::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 1px;
                background-color: var(--text);
                top: 50%;
                transform: translateY(-50%);
            }

            &::after {
                content: '';
                position: absolute;
                width: 1px;
                height: 100%;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--text);
            }
        }
    }

    .more {
        position: relative;

        .button {
            width: 50px;
            font-weight: bold;
            font-size: 20px;
            text-align: center;
        }
    }
}

.hidden-item {
    opacity: 0;
    pointer-events: none;
}

.hidden-container-distance {
    align-items: center;
    height: 120px;

    .main .content {
        justify-content: center;
        font-weight: 12px;
    }
}
</style>