<template>
    <confirm-vue title="是否删除当前标签" :display="confirmBoxDisplay" @confirm-result="confirmResult"></confirm-vue>
    <scroll-view scroll-y class="side-container" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
        <view :class="['background', display ? 'background-show' : '']" @click="backgroundClick">
            <mask-vue></mask-vue>
        </view>
        <page-container :show="pageContainerShow" class="page-container">
            <view class="background-input">
                <inner-nav-vue title="重命名" :isInterceptBack="true" @clickBackButton="clickBackButton"></inner-nav-vue>
                <input class="update-input" :value="tagUpdateBoxPrepValue" type="text" @input="updateBoxInputHandler" />
                <view class="update-button" @click="confirmChangeTag">修改</view>
                <view :class="['tips', updateOverTips ? 'error' : '']">{{ updateOverTips }}</view>
            </view>
        </page-container>
        <view class="content" :style="{
            paddingTop: `${statusBarHeight + 20}px`, left: `${left}px`,
            transition: moving ? '0s' : '0.3s'
        }">
            <view class="user" @click="clickUserName">{{ cls }}</view>
            <view class="tags">
                <view class="title">标签列表</view>
                <view class="list">
                    <view class="item" v-for="(v, k, i) in tagsList" :key="k"
                        :style="{ height: `${listInfo[k].open ? heightHandler(k) : 36}px` }">
                        <view class="main">
                            <view class="tagsFlag">#</view>
                            <view class="main-info">
                                <view class="text" v-for="(v3, i3) in listInfo[k].arr" :key="i3" @click="showDetail"
                                    :data-index="i3" :data-firstTag="k">{{ v3 }}
                                </view>
                            </view>
                            <view class="main-button">
                                <view class="main-detail" v-if="detailShow(v)" @click="changeHeight" :data-tag="k"
                                    :style="{ transform: `${listInfo[k].open ? 'rotate(135deg)' : 'rotate(45deg)'}` }">
                                </view>
                                <view class="main-more">
                                    <text :id="computedId(k, 0)" :data-tag="k" :data-flag="0"
                                        @click="chooseMore">...</text>
                                    <more-vue :display="listInfo[computedId(k, 0)] || false" :list="filterMoreList(v)"
                                        :top="topDistance" :left="leftDistance" @closeMoreShow="closeMoreShow"
                                        @execute="executeMore"></more-vue>
                                </view>
                            </view>
                        </view>
                        <view class="part" v-for="(v1, k1, i1) in loopTagsList(k)" :key="i1">
                            <view class="line"></view>
                            <view class="part-info" :data-parent="k" :data-child="k1" @click="clickChildTag">{{ k1 }}
                            </view>
                            <view class="part-button">
                                <view class="part-detail" :data-total="k" :data-part="k1" :data-obj="v1"
                                    @click="locateTag" v-if="detailShow(v1)"></view>
                                <view class="part-more">
                                    <text :id="computedId(k1, 1)" @click="chooseMore" :data-tag="k1" :data-flag="1"
                                        :data-pre-tag="k">...</text>
                                    <more-vue :display="listInfo[computedId(k1, 1)] || false" :list="filterMoreList(v1)"
                                        :top="topDistance" :left="leftDistance" @closeMoreShow="closeMoreShow">
                                    </more-vue>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </scroll-view>
</template>

<script setup>

import maskVue from '../common/mask.vue'
import systemStore from '../../store/system'
import { useAttrs, toRefs, ref, watch, getCurrentInstance } from 'vue'
import tagsStore from '../../store/tags'
import { getTagsList, deleteTagApi, renameTagApi } from '../../api/tags'
import moreVue from '../common/more.vue'
import { getNoteByTag } from '../../api/note'
import { storeToRefs } from 'pinia'
import innerNavVue from '../common/inner-nav.vue'
import { updateTagName } from '../../utils/tag-info-change'
import { tagValidCheck } from '../../utils/tag-check'
import showToast from '../../utils/show-toast'
import userStore from '../../store/user'
import deleteUseLessTag from '../../utils/delete-tag'
import confirmVue from '../common/confirm.vue'

async function confirmResult(flag) {
    if (flag) {
        const result = await deleteTagApi(moreInfoRecord.tag)

        if (!result) return

        deleteUseLessTag(moreInfoRecord.tag)
    }

    confirmBoxDisplay.value = false
}

function executeMore(id) {
    moreExecFunc[id]()
}

async function clickUserName() {
    uni.navigateTo({
        url: '/sub-package/user-info/index/index'
    })
}

function updateBoxInputHandler(e) {
    if (updateOverTips.value) updateOverTips.value = ''
    tagUpdateValueRecord = e.detail.value
}

async function confirmChangeTag() {
    const oldTag = tagUpdateBoxPrepValue.value
    const newTag = tagUpdateValueRecord.trim().replace(/\/+/g, '/')

    if (newTag.split(' ').length > 1) {
        return showToast('不应出现空格')
    }

    if (newTag.match(/^\/|\/$/)) {
        return showToast('两侧无需出现/')
    }

    if (newTag === oldTag || newTag === '') return clickBackButton()

    const traverseObj = tagsList.value
    const str = oldTag

    const originObj = (function () {
        const array = str.split('/')
        let temp = traverseObj

        for (let i of array) {
            temp = temp[i]
        }

        return temp
    })()

    let childArray = []

    function objLength(obj) {
        return Reflect.ownKeys(obj).length
    }

    function countFunc(obj, arr) {
        for (let i in obj) {
            if (objLength(obj[i])) {
                countFunc(obj[i], [...arr, i])
            }
            else {
                childArray = [...arr, i]
            }
        }
    }

    countFunc(originObj, [])

    let totalTag = newTag + '/' + childArray.join('/')

    const checkResult = tagValidCheck(totalTag)

    if (!checkResult) return updateOverTips.value = `包含子标签在内"${totalTag}"已达上限`

    const renameResult = await renameTagApi({ oldTag, newTag })

    if (renameResult) updateTagName(moreInfoRecord.tag, tagUpdateValueRecord)

    clickBackButton()
}

function clickBackButton() {
    pageContainerShow.value = false
}

function computedId(tag, flag) {
    if (tag.match(/[\u4E00-\u9FA5]/)) {
        if (Reflect.has(chineseTagObj, tag)) {
            return chineseTagObj[tag]
        } else {
            const value = 'a' + (Date.now() + '').slice(10, 14) + Math.floor(Math.random() * 10000)

            chineseTagObj[tag] = value

            return chineseTagObj[tag]
        }
    }

    return tag + '-' + flag
}

function renameTag() {
    let tag = moreInfoRecord.tag

    pageContainerShow.value = true
    tagUpdateBoxPrepValue.value = tag
}

function deleteTag() {
    confirmBoxDisplay.value = true
}

function requestTag(name) {
    getNoteByTag(name)
    emits('closeSide', name)
}

function clickChildTag(e) {
    const parentName = e.currentTarget.dataset.parent
    const childName = e.currentTarget.dataset.child

    const arr = listInfo.value[parentName].arr

    requestTag(arr.join('/') + '/' + childName)
}

function closeMoreShow(id) {
    if (id !== undefined) {
        if (moreInfoRecord.flag) executeMore(id)
    }

    listInfo.value[moreInfoRecord.id] = false
}

function filterMoreList(tag) {
    return Reflect.ownKeys(tag).length ? moreListContent.slice(0, 1) : moreListContent
}

function chooseMore(e) {
    const id = e.target.id
    const flag = e.currentTarget.dataset.flag - 0
    const tag = e.currentTarget.dataset.tag

    moreInfoRecord.tag = tag

    const preTag = flag ? e.currentTarget.dataset.preTag : tag

    let topExistItem = listInfo.value[preTag].arr
    let array = []

    for (let i in topExistItem) {
        array.push(topExistItem[i])
    }

    moreInfoRecord.flag = flag
    moreInfoRecord.tag = array.join('/') + (flag ? '/' + moreInfoRecord.tag : '')
    moreInfoRecord.id = id

    uni.createSelectorQuery().in(instance).select(`#${id}`).boundingClientRect(res => {
        topDistance.value = res.top
        leftDistance.value = res.left - 14
        listInfo.value[id] = true
    }).exec()
}

function showDetail(e) {
    const index = e.currentTarget.dataset.index
    const firstTag = e.currentTarget.dataset.firsttag
    const arr = listInfo.value[firstTag].arr

    if (arr.length === 1) return requestTag(firstTag)
    if (index === arr.length - 1) return

    listInfo.value[firstTag].arr = arr.slice(0, index + 1)
}

function locateTag(e) {
    const total = e.currentTarget.dataset.total
    const part = e.currentTarget.dataset.part
    const obj = e.currentTarget.dataset.obj

    if (!Reflect.ownKeys(obj).length) return

    listInfo.value[total].arr.push(part)
}

function loopTagsList(firstTag) {
    const arr = listInfo.value[firstTag].arr
    let temp = tagsList.value

    for (const i of arr) {
        temp = temp[i]
    }

    return temp
}

function changeHeight(e) {
    const tag = e.currentTarget.dataset.tag

    listInfo.value[tag]['open'] = !listInfo.value[tag]['open']
}

function heightHandler(obj) {
    let topExistItem = listInfo.value[obj].arr
    let array = []
    let index = tagsList.value

    for (let i in topExistItem) {
        array.push(topExistItem[i])
    }

    for (let i of array) {
        index = index[i]
    }

    return (Reflect.ownKeys(index).length + 1) * 36
}

function detailShow(obj) {
    return Reflect.ownKeys(obj).length
}

function backgroundClick() {
    emits('closeSide')
}

function touchStart(e) {
    if (!display.value) return

    moving.value = true
    start = e.touches[0].pageX
    sideStart = left.value
}

function touchMove(e) {
    distance = e.touches[0].pageX - start

    const temp = sideStart + distance

    if (temp > 0) return

    left.value = temp
}

function touchEnd() {
    moving.value = false

    if (left.value >= (screenWidth / 2 - (screenWidth - 60))) {
        left.value = 0
    } else {
        emits('closeSide')
    }
}

const { statusBarHeight, screenWidth } = systemStore()
const { display } = toRefs(useAttrs())
const emits = defineEmits(['closeSide'])
const left = ref()
const moving = ref(false)
const { tagsList, listInfo } = storeToRefs(tagsStore())
let distance = 0, start = 0, sideStart
const moreListContent = [
    { id: 0, name: '重命名' },
    { id: 1, name: '删除', important: true }
]
const topDistance = ref()
const leftDistance = ref()
const moreInfoRecord = {}
const instance = getCurrentInstance()
const moreExecFunc = [renameTag, deleteTag]
const pageContainerShow = ref()
const tagUpdateBoxPrepValue = ref('')
let tagUpdateValueRecord = ''
const chineseTagObj = {}
const updateOverTips = ref('')
const user = userStore()
const { name: userName } = storeToRefs(user)
const confirmBoxDisplay = ref(false)

watch(display, () => {
    left.value = display.value ? 0 : 60 - screenWidth

    if (display.value) getTagsList()
}, { immediate: true })

</script>

<style lang="less" scoped>
.side-container {
    position: relative;
    color: var(--title);

    .background {
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
        height: 100vw;
        opacity: 0;
        pointer-events: none;
    }

    .page-container {
        .background-input {
            width: 100vw;
            height: 100vh;
            background-color: var(--background-color);

            .update-input {
                height: 40px;
                width: calc(100% - 40px);
                border-radius: 4px;
                background-color: var(--shallow);
                color: var(--title);
                margin: 4px auto 10px;
                padding-left: 14px;
            }

            .update-button {
                width: 60px;
                height: 30px;
                line-height: 30px;
                text-align: center;
                border-radius: 4px;
                background-color: var(--condition-background);
                color: var(--condition-text);
                float: right;
                margin-right: 20px;
            }

            .tips {
                width: calc(100% - 40px);
                margin: 60px auto 0;
                color: var(--title);
                font-size: 12px;
            }

            .error {
                line-height: 20px;
                padding: 10px 10px 10px 40px;
                border: 1px solid var(--condition-background);
                border-radius: 4px;
                box-sizing: border-box;
                position: relative;
                word-break: break-all;

                &::after {
                    content: 'tips: ';
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    color: var(--text);
                    height: 80%;
                }
            }
        }
    }

    .content {
        width: calc(100vw - 60px);
        height: 100vh;
        box-sizing: border-box;
        background-color: var(--background-color);
        position: fixed;
        top: 0;
        z-index: 2;
        padding-left: 30px;

        .user {
            font-size: 16px;
            font-weight: bold;
            position: relative;
            margin-bottom: 50px;

            &::after {
                content: '';
                position: absolute;
                bottom: -14px;
                height: 1px;
                width: 80px;
                background-color: var(--line);
                left: 0;
            }
        }

        .tags {
            .title {
                margin-bottom: 10px;
                font-size: 16px;
            }

            .list {

                .item .main,
                .item .part {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .item {
                    overflow: hidden;
                    transition: .2s;

                    .main-button,
                    .part-button {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .main-button .main-detail,
                    .part-button .part-detail,
                    .main-button .main-more,
                    .part-button .part-more {
                        width: 30px;
                        text-align: center;
                        position: relative;
                    }

                    .main .main-button .main-more,
                    .part .part-button .part-more {
                        font-weight: bold;
                        font-size: 16px;
                        top: -4px;
                        left: -10px;
                        position: relative;
                    }

                    .main-button .main-detail,
                    .part-button .part-detail {
                        width: 9px;
                        height: 9px;
                        border-top: 1px solid var(--title);
                        border-right: 1px solid var(--title);
                        transition: 0.2s;
                        margin: 0 20px 0 10px;
                    }

                    .part-button .part-detail {
                        transform: rotate(45deg) translate(-25%);
                        border-top: 0.5px solid var(--text);
                        border-right: 0.5px solid var(--text);
                    }

                    .main-info {
                        margin-left: 14px;
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        width: 0;
                        color: var(--blue);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        position: relative;
                        margin-right: 4px;

                        &::after {
                            position: absolute;
                            content: '';
                            right: -4px;
                            top: 0;
                            width: 50px;
                            height: 36px;
                            background: linear-gradient(to right, transparent, var(--background-color));
                            pointer-events: none;
                        }

                        .text {
                            font-weight: bold;

                            &:not(:first-child)::before {
                                content: '\00A0/\00A0';
                                color: var(--text);
                                font-weight: normal;
                            }
                        }
                    }

                    .main {
                        display: flex;
                        justify-content: space-between;
                        height: 36px;

                        .tagsFlag {
                            font-size: 14px;
                            font-weight: bold;
                            width: 14px;
                            text-align: center;
                        }
                    }

                    .part {
                        .line {
                            width: 14px;
                            height: 36px;
                            position: relative;

                            &::after {
                                content: '';
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                height: 36px;
                                width: 1px;
                                background-color: var(--line);
                            }
                        }

                        .part-info {
                            flex: 1;
                            margin-left: 30px;
                            margin-right: 10px;
                            color: var(--blue);
                        }

                        .part-more {
                            width: 30px;
                            text-align: center;
                        }
                    }
                }
            }
        }
    }

    .background-show {
        opacity: 1;
        pointer-events: auto;
    }
}
</style>

