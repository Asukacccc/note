<template>
    <view class="index-container">
        <outer-nav-vue :list="topList" @iconClick="iconClick"></outer-nav-vue>
        <view class="line" :style="{ height: `${availableHeight - 20}px` }"></view>
        <write-choose-vue></write-choose-vue>
        <tags-vue :display="tagsDisplay" @close-side="closeSide"></tags-vue>
        <scroll-view class="content" scroll-y lower-threshold="20" @scrolltolower="scrollLower" v-if="list.length">
            <note-item-vue v-for="v in list" :key="v.id" :date="v.updateTime" :tag="v.tag" :brief="v.brief"
                :textLink="v.textLink" :title="v.title" :noteId="v.id" :shareDate="v.shareDate"></note-item-vue>
            <note-item-vue brief="路的尽头 ..." :over="loadOver" v-if="loadOver"></note-item-vue>
        </scroll-view>
        <view class="not-note" v-else>
            <view class="top">N/A</view>
            <view class="bottom">当前没有笔记</view>
        </view>
    </view>
</template>

<script setup>

import outerNavVue from '@/component/common/outer-nav.vue'
import { ref } from 'vue'
import { getToken, getUserInfo } from '../../api/user.js'
import { getNote } from '../../api/note.js'
import noteItemVue from '../../component/special/note-item.vue'
import noteStore from '../../store/note'
import systemStore from '../../store/system'
import tagsVue from '../../component/special/tags.vue'
import { getNoteByTag } from '../../api/note'
import { storeToRefs } from 'pinia'
import writeChooseVue from '../../component/special/write-choose.vue'
import shareStore from '../../store/share'
import { onShow } from '@dcloudio/uni-app'

async function getListOnTag() {
    const result = await getNoteByTag()

    if (typeof result === 'boolean') {
        loadOver.value = true
    }
}

function closeSide(name) {
    tagsDisplay.value = false

    if (name) {
        tagName = name
        isTagPage = true

        topList.value = [{ id: 0, type: 'icon', src: '/static/home.png', link: 'not' }, { id: 1, type: 'text', content: tagName }]
    }
}

function iconClick() {
    if (isTagPage) {
        const temp = note.tempList

        note.list = temp
        isTagPage = false
        loadOver.value = note.isOver
        topList.value = originTopList
        note.tagRequestStart = 0
    } else {
        tagsDisplay.value = true
    }
}

async function getUserNote(num) {
    const result = await getNote(num)

    if (typeof result === 'boolean') {
        loadOver.value = true
        note.isOver = true
    }
}

function scrollLower() {
    if (loadOver.value) return

    isTagPage ? getListOnTag() : getUserNote()
}

const note = noteStore()
const { list } = storeToRefs(note)
const system = systemStore()
const { availableHeight } = system
const firstLoadNum = Math.ceil((availableHeight - 20) / (42 + 30))
const loadOver = ref(false)
const tagsDisplay = ref(false)
let tagName = ''
const originTopList = [{ id: 0, type: 'icon', src: '/static/list.png', link: 'not' },
{ id: 1, type: 'icon', src: '/static/search.png', link: '/sub-package/search/search/search?fromIndex=1' }]
let isTagPage = false
const topList = ref(originTopList)
const share = shareStore();

(async function () {
    const tokenAcquireResult = await getToken()

    if (!(tokenAcquireResult instanceof Error)) {
        getUserInfo()
    }
})()

onShow(() => {
    if (share.isDelete) {
        share.isDelete = false

        const item = list.value.find(v => v.id === share.noteId)
        item['shareDate'] = ''
    }

    share.openShareDate && (share.openShareDate = '')
})

getUserNote(firstLoadNum + 1)

note.firstRequestLength = firstLoadNum + 1

</script>

<style lang="less" scoped>
.index-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .line {
        position: fixed;
        bottom: 0;
        left: 70px;
        width: 1px;
        background-color: var(--line);
        z-index: -1;
    }

    .write {
        position: fixed;
        bottom: 40px;
        right: 40px;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 1px 1px 2px 2px var(--map-background);
        background-color: white;
        z-index: 1;

        .write-img {
            width: 40px;
            height: 40px;
            display: block;
        }
    }

    .content,
    .not-note {
        flex: 1;
        height: max-content;
        overflow: hidden;
        position: relative;
        box-sizing: border-box;
        padding-top: 24px;
    }

    .not-note {
        color: var(--condition-background);
        position: relative;

        .top {
            font-size: 30px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            margin-top: 200px;
            color: var(--title);
        }

        .bottom {
            color: var(--condition-text);
            font-size: 12px;
            letter-spacing: 2px;
            text-align: center;
        }
    }
}
</style>