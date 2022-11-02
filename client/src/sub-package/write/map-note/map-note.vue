<template>
    <view class="map-container" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
        <view>
            <inner-nav-vue :title="isViewPage ? '查看' :'创建思维导图'"></inner-nav-vue>
        </view>
        <view class="info" :style="{ top: `${statusBarHeight + navigatorBarHeight}px` }">
            <view class="tag"><text class="identification">#</text>
                <input type="text" :style="{ color: tagValueError ? '#f38181' : '' }" class="tag-input"
                    :disabled="isViewPage" placeholder="此处输入标签, 空格划分, /指定从属" :value="tagValue" @input="tagInputHandler"
                    @blur="tagBlur">
            </view>
            <view class="title"><input type="text" placeholder="在此输入标题, 长度最高为20" class="title-input" :value="titleValue"
                    @input="titleInputHandler" maxlength="20" :disabled="isViewPage">
            </view>
        </view>
        <view class="main-boy">
            <movable-area class="movable-area">
                <movable-view class="movable-view" direction="all" :x="distanceX" :y="distanceY" :out-of-bounds="true">
                    <view class="map">
                        <view class="control-floor"
                            :style="{ height: `${ plain() * 50 }px`, width: `${ computedWidth() }px` }">
                            <view v-for="(v, i) in floorList" :key="v.floorId" class="floor">
                                <view v-for="(v2, i2) in v.list" :key="v2.childId">
                                    <view class="floorItem"
                                        :style="{ top: itemInfo[v2.childId].top + 'px', left: `${ i * 150 }px` }">
                                        <view
                                            :class="['text', activeItem[v2.childId] ? 'active' : '', itemInfo[v2.childId].isLink ? 'link' : '']"
                                            @click="clickNode" :data-floor="i" :data-currentId="v2.childId">{{
                                            itemInfo[v2.childId].name }}</view>
                                    </view>
                                    <view v-if="i > 0" class="line" :style="computedLine(i, v2.childId)"></view>
                                </view>
                            </view>
                        </view>
                    </view>
                </movable-view>
            </movable-area>
            <view class="bottom-control" :style="{ bottom: `${ bottomInfoHeightChange }px` }" v-if="!isViewPage">
                <input type="text" :class="['content-input', isInputLink ? 'input-link' : '']" placeholder="限10字"
                    @blur="inputBlur" :value="inputContent" maxlength="10" @confirm="confirmChangeContent"
                    :focus="focus" @input="changeItemContent" @focus="inputFocus" :cursor-spacing="50"
                    :adjust-position="false">
                <view class="link-control">
                    <view class="icons">
                        <image :src="darkMode ? '/static/link-black.png' : '/static/link-white.png'" class="link-icon"
                            @click.stop="selectNoteLink">
                        </image>
                        <image class="location-icon" @click="locateOrigin"
                            :src="darkMode ? '/static/location-black.png' : '/static/location-white.png'"></image>
                    </view>
                    <view class="control">
                        <view class="delete" @click="deleteNode">删除该节点</view>
                        <view class="add" @click="addChildNode">添加此节点</view>
                    </view>
                </view>
            </view>
            <view class="lookPageTool" v-else>
                <view class="time" v-html="changeDateFormat()"></view>
                <image class="tool-icon" @click="locateOrigin"
                    :src="darkMode ? '/static/location-black.png' : '/static/location-white.png'"></image>
                <image class="tool-icon" src="/static/share.png" @click="clickShareIcon"></image>
                <image class="tool-icon" src="/static/edit.png" @click="editTextNote"></image>
            </view>
        </view>
    </view>
</template>

<script setup>

import innerNavVue from '../../../component/common/inner-nav.vue'
import { storeToRefs } from 'pinia'
import { reactive, ref, watch } from 'vue'
import showToast from '../../../utils/show-toast'
import system from '../../../store/system'
import linkStore from '../../../store/link'
import { onShow, onUnload, onLoad, onHide } from '@dcloudio/uni-app'
import { setNote, getLatestNote, getNoteContent, updateNoteInfo, getNotePartInfo } from '../../../api/note'
import noteStore from '../../../store/note'
import { tagValidCheck } from '../../../utils/tag-check'
import dateConversion from '../../../utils/date-conversion'
import shareStore from '../../../store/share'

function changeDateFormat() {
    const infoArray = dateConversion(date.value)
    return `${infoArray[0]} ${infoArray[0] ? '- ' : ' '}<span style="font-weight:bold">${infoArray[1]}</span>`
}

function clickShareIcon() {
    uni.navigateTo({
        url: `/sub-package/write/share/share?id=${originNoteState.id}&shareDate=${originNoteState.shareDate}`
    })
}

function editTextNote() {
    isChangeState = true
    isViewPage.value = false
}

function locateOrigin() {
    distanceX.value = 10000 - screenWidth
    distanceY.value = 120
}

function tagBlur() {
    const result = tagValidCheck(tagInputRecord)

    if (result) {
        tagValueError.value = false
    } else {
        tagValueError.value = true
    }
}

function tagInputHandler(e) {
    const value = e.detail.value
    tagInputRecord = value
}

function titleInputHandler(e) {
    const value = e.detail.value

    if (value.length === 20) showToast('已达最大长度')

    titleInputRecord = value
}

function selectNoteLink() {
    if (!activeItem[currentClickInfo.currentId]) return showToast('未选择节点')

    selectNoteClosePage = true

    uni.navigateTo({
        url: '/sub-package/search/search/search?fromIndex=0'
    })
}

function deleteNode() {
    const currentId = currentClickInfo.currentId
    const floorId = currentClickInfo.floorId

    if (!activeItem[currentClickInfo.currentId]) return showToast('未选择节点')
    if (currentId === 0) return showToast('无法移去根节点')
    else {
        function deleteChildNode(floor, current) {
            function deleteInfo() {
                floorList[floor].list = floorList[floor].list.filter(v => v.childId !== current)
                Reflect.deleteProperty(itemInfo, current)

                if (floorList[floor].list.length === 0) Reflect.deleteProperty(floorList, floor)
            }

            const children = parentChildRelation[current]

            if (!children) {
                deleteInfo()
                return
            }
            else {
                for (let i of children) {
                    deleteChildNode(floor + 1, i)
                }
                deleteInfo()
                Reflect.deleteProperty(parentChildRelation, current)
            }
        }

        deleteChildNode(floorId, currentId)

        const parentId = getParentId(floorId, currentId)

        parentChildRelation[parentId] = parentChildRelation[parentId].filter(v => v !== currentId)

        if (parentChildRelation[parentId].length === 0) Reflect.deleteProperty(parentChildRelation, parentId)

        inputContent.value = ''

        Reflect.deleteProperty(itemInfo, currentId)
    }
}

function computedChildCount(num = 0, count = 0) {
    const result = Reflect.has(parentChildRelation, num)

    if (result) {
        for (let i of parentChildRelation[num]) {
            count += computedChildCount(i)
        }

        return count
    } else {
        return ++count
    }
}

function computedLine(floorId, currentId) {
    let parentId = getParentId(floorId, currentId)
    const parentTop = itemInfo[parentId].top
    const childTop = itemInfo[currentId].top
    const left = floorId * 150

    if (parentTop === childTop) {
        return {
            height: '0.5px',
            top: `${parentTop + 25}px`,
            transform: 'translateY(-50%)',
            left: `${left}px`,
            backgroundColor: 'var(--text)'
        }
    } else {
        const height = Math.abs(parentTop - childTop)
        const parentHigher = parentTop < childTop
        const top = parentHigher ? parentTop + 25 : childTop + 25
        const obj = { height: `${height}px`, top: `${top}px`, left: `${left}px`, borderLeft: '1px solid var(--text)' }

        if (parentHigher) {
            obj['borderBottom'] = '1px solid var(--text)'
            obj['borderBottomLeftRadius'] = '100%'
        }
        else {
            obj['borderTop'] = '1px solid var(--text)'
            obj['borderTopLeftRadius'] = '100%'
        }

        return obj
    }
}

function computedWidth() {
    return Reflect.ownKeys(floorList).length * 150
}

function getParentId(floorId, currentId) {
    const parentList = floorList[floorId - 1].list
    let parentId = 0

    for (let i of parentList) {
        const itemId = i.childId

        if (!parentChildRelation[itemId]) continue

        const currentItemIndex = (function () {
            return parentChildRelation[itemId].indexOf(currentId)
        })()

        if (currentItemIndex !== -1) {
            parentId = itemId
            break
        }
    }

    return parentId
}

function collectGrandfatherNodeCount(floorId, itemList, array) {
    function shiftArray(num) {
        const temp = []

        for (let i = 0; i < num; i++) {
            temp[i] = false
        }

        return temp
    }

    function executeBefore(floor, current, count = 0) {
        if (floor === 0) {
            return count
        }

        const parentId = getParentId(floor, current)

        for (let i of parentChildRelation[parentId]) {
            if (i === current) break
            else {
                count += computedChildCount(i)
            }
        }

        return executeBefore(floor - 1, parentId, count)
    }

    function executeMiddle(floor, pre, later, count = 0) {
        if (floor === 0) return count

        const topParent = getParentId(floor, pre)
        const bottomParent = getParentId(floor, later)

        if (topParent === bottomParent) {
            let list = parentChildRelation[topParent]
            const startIndex = list.indexOf(pre)
            const endIndex = list.indexOf(later)

            list = list.slice(startIndex + 1, endIndex)

            for (let i of list) {
                count += computedChildCount(i)
            }

            return count
        } else {
            let topList = parentChildRelation[topParent]
            let bottomList = parentChildRelation[bottomParent]
            const topIndex = topList.indexOf(pre)
            const bottomIndex = bottomList.indexOf(later)
            topList = topList.slice(topIndex + 1)
            bottomList = bottomList.slice(0, bottomIndex)

            for (let i of [...topList, ...bottomList]) {
                count += computedChildCount(i)
            }

            return executeMiddle(floor - 1, getParentId(floor, pre), getParentId(floor, later), count)
        }
    }

    if (floorId === 0) return 0

    const parentId = getParentId(floorId, itemList[0].childId)
    const previous = executeBefore(--floorId, parentId)
    const previousArray = shiftArray(previous)
    let originArray = [...array]
    let offset = previous

    originArray = [...previousArray, ...originArray]

    if (array.length > 1) {
        for (let i = 0; i < array.length - 1; i++) {
            const count = executeMiddle(floorId, getParentId(floorId + 1, itemList[i].childId), getParentId(floorId + 1, itemList[i + 1].childId))
            const middleArray = shiftArray(count)

            originArray.splice(offset + i + 1, 0, ...middleArray)
            offset += count
        }
    }

    return originArray
}

function plain() {
    const totalCount = computedChildCount(0) || 1

    for (let i = 0; i < Reflect.ownKeys(floorList).length; i++) {
        let array = [], tempArray = []

        if (i) {
            const list = floorList[i - 1].list

            for (let k of list) {
                const id = k.childId
                const childList = parentChildRelation[id] || []

                if (childList.length) {
                    array.push(childList.map(v => {
                        return computedChildCount(v)
                    }))
                }
            }

            for (let k of array) {
                tempArray = [...tempArray, ...k]
            }

            array = tempArray
            array = collectGrandfatherNodeCount(i, floorList[i].list, [...array])
        } else {
            array = [totalCount]
        }

        const beforeTotal = (function () {
            let tempSave = []

            for (let k = 0; k < array.length; k++) {
                if (array[k] === false) tempSave[k] = false
                else {
                    tempSave[k] = array.slice(0, k).reduce((total, value) => {
                        if (value === false) total += 1
                        else total += value

                        return total
                    }, 0)
                }
            }

            tempSave = tempSave.filter(v => v !== false)
            return tempSave
        })()

        array = array.filter(v => v != false)

        for (let k = 0; k < array.length; k++) {
            itemInfo[floorList[i].list[k].childId].top =
                totalCount * 50 * (array[k] / totalCount) * 0.5 - 25 + (beforeTotal[k]) * 50
        }
    }

    return totalCount
}

function inputFocus(e) {
    const { height } = e.detail

    bottomInfoHeightChange.value = height - 10
}

function confirmChangeContent() {
    if (!activeItem[currentClickInfo.currentId]) return showToast("当前未选中节点")
    if (isInputLink.value) isInputLink.value = false

    if (itemInfo[currentClickInfo.currentId].isLink && inputValueRecord.indexOf('@') === -1) itemInfo[currentClickInfo.currentId].isLink = false

    itemInfo[currentClickInfo.currentId].name = inputValueRecord
    inputContent.value = inputValueRecord
}

function changeItemContent(e) {
    const { value } = e.detail

    if (value === '' && isInputLink.value) isInputLink.value = false
    if (value.length >= 10) showToast('已达最大长度')

    inputValueRecord = value
}

function addChildNode() {
    function insertPosition() {
        let total = 0
        const arr = floorList[newFloorId - 1].list

        for (let i = 0; i < arr.length; i++) {
            total = (function () {
                if (parentChildRelation[arr[i].childId]) {
                    return total + parentChildRelation[arr[i].childId].length
                } else return total
            })()

            if (arr[i].childId === currentClickInfo.currentId) break
        }

        existFloorItems.splice(total, 0, { childId: newItemId })

        return existFloorItems
    }

    if (!activeItem[currentClickInfo.currentId]) return showToast('未选择父节点')

    const newItemId = increaseId++
    const newFloorId = currentClickInfo.floorId + 1
    const existFloorItems = floorList[newFloorId] && floorList[newFloorId].list || []

    if (existFloorItems.length + 1 >= verticalMaxCount) return showToast('已达垂直可视区域上限')
    if (newFloorId + 1 >= horizontalMaxCount) return showToast('已达水平可视区域上限')
    if (typeof parentChildRelation[currentClickInfo.currentId] === 'undefined') parentChildRelation[currentClickInfo.currentId] = []

    floorList[newFloorId] = { floorId: newFloorId, list: insertPosition() }
    parentChildRelation[currentClickInfo.currentId].push(newItemId)
    itemInfo[newItemId] = { itemId: newItemId, name: '(无内容)', isLink: false }

    activeItem[currentClickInfo.currentId] = false
    currentClickInfo.currentId = newItemId
    currentClickInfo.floorId = newFloorId
    activeItem[newItemId] = true
    inputContent.value = '(无内容)'
    isInputLink.value = false
}

function touchStart(e) {
    originCoordinatePosition.x = e.touches[0].pageX
    originCoordinatePosition.y = e.touches[0].pageY
}

function touchMove(e) {
    const moveX = e.touches[0].pageX - originCoordinatePosition.x
    const moveY = e.touches[0].pageY - originCoordinatePosition.y

    distanceX.value = moveX + originElementPosition.x >= 0 ? moveX + originElementPosition.x : 0
    distanceY.value = moveY + originElementPosition.y >= 0 ? moveY + originElementPosition.y : 0
}

function touchEnd() {
    originElementPosition.x = distanceX.value
    originElementPosition.y = distanceY.value
}

function inputBlur() {
    inputContent.value += ' '
    bottomInfoHeightChange.value = 0
}

async function clickNode(e) {
    const { floor, currentid } = e.currentTarget.dataset
    const currentId = currentid

    if (isViewPage.value && currentId - 0 === currentClickInfo.currentId && itemInfo[currentClickInfo.currentId].isLink) {
        const id = itemInfo[currentId].isLink - 0

        const result = await getNotePartInfo(id)

        if (!result) return
        else {
            const isMapNote = result.message.title

            if (isMapNote) {
                uni.navigateTo({
                    url: `/sub-package/write/map-note/map-note?loadType=0&` +
                        `id=${itemInfo[currentId].isLink}&title=${result.message.title}&tag=${result.message.tag}&textLink=${result.message.textLink}`
                })
            } else {
                uni.navigateTo({
                    url: `/sub-package/write/text-note/text-note?loadType=0&` +
                        `id=${itemInfo[currentId].isLink}&tag=${result.message.tag}&textLink=${result.message.textLink}`
                })
            }
        }
    }

    activeItem[currentClickInfo.currentId] = false
    currentClickInfo.floorId = floor - 0
    currentClickInfo.currentId = currentId - 0
    activeItem[currentId] = true
    inputContent.value = itemInfo[currentId].name
    inputValueRecord = inputContent.value

    if (!isViewPage.value) {
        if (itemInfo[currentId].isLink) {
            isInputLink.value = true
        } else {
            isInputLink.value = false
        }
    }

}

function mergeObj(target, origin) {
    for (const i in origin) {
        target[i] = origin[i]
    }
}

const { statusBarHeight, navigatorBarHeight, screenWidth } = system()
const { darkMode } = storeToRefs(system())
const parentChildRelation = { 0: [] }
const floorList = reactive({})
const itemInfo = reactive({})
let currentClickInfo = {}
const activeItem = reactive({})
const inputContent = ref('')
const originCoordinatePosition = {}
const originElementPosition = { x: 10000 - screenWidth, y: 0 }
let inputValueRecord = ''
const distanceX = ref(10000 - screenWidth)
const distanceY = ref(120)
const horizontalMaxCount = Math.floor(10000 / 150)
const verticalMaxCount = Math.floor((10000 - 120) / 50)
const bottomInfoHeightChange = ref(0)
const link = linkStore()
let selectNoteClosePage = false
const isInputLink = ref(false)
let titleInputRecord = ''
const titleValue = ref('')
let tagInputRecord = ''
const tagValue = ref('')
let recordTimer
const focus = ref(false)
const tagValueError = ref(false)
const isViewPage = ref(false)
let isChangeState = false
let increaseId = 1
const originNoteState = {}
const date = ref('')
const share = shareStore()

floorList['0'] = { floorId: 0, list: [{ childId: 0 }] }
itemInfo['0'] = { itemId: 0, name: '初始节点', isLink: false, top: 0 }

onLoad(async options => {
    function computedIncreaseId() {
        const array = Reflect.ownKeys(itemInfo)
        return array[array.length - 1] - 0 + 1
    }

    uni.setStorageSync('loaded', true)

    const loadType = options.loadType - 0

    if (loadType === 1) {
        const noteInfo = uni.getStorageSync('map-note')
        tagValue.value = noteInfo['tag']
        titleValue.value = noteInfo['title']

        mergeObj(parentChildRelation, noteInfo['content'][0])
        mergeObj(floorList, noteInfo['content'][1])
        mergeObj(itemInfo, noteInfo['content'][2])

        tagInputRecord = tagValue.value
        titleInputRecord = titleValue.value

        tagBlur()

        isViewPage.value = uni.getStorageSync('isViewPage')
        increaseId = computedIncreaseId()
        isChangeState = uni.getStorageSync('isChangeState')
        date.value = uni.getStorageSync('date')

        originNoteState.originTag = uni.getStorageSync('originTag')
        originNoteState.originTitle = uni.getStorageSync('originTitle')
        originNoteState.originContent = uni.getStorageSync('originContent')
        originNoteState.textLink = uni.getStorageSync('textLink')
        originNoteState.id = uni.getStorageSync('id') - 0
        originNoteState.shareDate = uni.getStorageSync('shareDate')
    } else if (loadType === 0) {
        isViewPage.value = true
        titleValue.value = options.title
        tagValue.value = options.tag
        titleInputRecord = titleValue.value
        tagInputRecord = tagValue.value
        date.value = options.updateTime

        const mapContent = await getNoteContent(options.textLink)

        if (!mapContent) return
        else {
            const content = JSON.parse(mapContent.message)
            mergeObj(parentChildRelation, content[0])
            mergeObj(floorList, content[1])
            mergeObj(itemInfo, content[2])

            originNoteState.tag = tagValue.value
            originNoteState.title = titleValue.value
            originNoteState.content = JSON.stringify(content)
            originNoteState.textLink = options.textLink
            originNoteState.id = options.id - 0
            originNoteState.originTitle = titleInputRecord
            originNoteState.originTag = tagInputRecord
            originNoteState.originContent = JSON.stringify([parentChildRelation, floorList, itemInfo])
            originNoteState.shareDate = options.shareDate

            uni.setStorageSync('date', date.value)
            uni.setStorageSync('originTitle', titleInputRecord)
            uni.setStorageSync('originTag', tagInputRecord)
            uni.setStorageSync('originContent', originNoteState.originContent)
            uni.setStorageSync('textLink', options.textLink)
            uni.setStorageSync('id', originNoteState.id)
            uni.setStorageSync('shareDate', options.shareDate)
        }
        increaseId = computedIncreaseId()
    }
})

onShow(() => {
    if (selectNoteClosePage) {
        if (!link.linkId) {
            showToast('尚未选择链接笔记')
        } else {
            inputContent.value = '@链接'
            isInputLink.value = true
            itemInfo[currentClickInfo.currentId].isLink = link.linkId + ''
            link.linkId = ''
            itemInfo[currentClickInfo.currentId].name = '@链接'
        }

        selectNoteClosePage = false
    }

    const share = shareStore()
    const note = noteStore()

    if (share.isDelete) {
        share.isDelete = false

        uni.setStorageSync('shareDate', '')
        originNoteState.shareDate = ''

        const item = note.list.find(v => v.id === originNoteState.id - 0)
        item && (item['shareDate'] = '')
    }
})

watch(() => share.openShareDate, () => {
    originNoteState.shareDate = share.openShareDate
    uni.setStorageSync('shareDate', share.openShareDate)
})

onHide(() => {
    share.openShareDate = ''
})

onUnload(async () => {
    clearInterval(recordTimer)
    tagBlur()

    if (!isViewPage.value) {
        if (Reflect.ownKeys(itemInfo).length === 1) return showToast('节点数为一，不进行保持')

        const title = titleInputRecord || '未定义标题'
        const tag = tagValueError.value ? '' : [...new Set(tagInputRecord.split(' '))].join(' ').replace(/\/+/g, '/')
        const date = Date.now()
        const content = JSON.stringify([parentChildRelation, floorList, itemInfo])
        const brief = ''

        if (tagValueError.value) {
            setTimeout(() => {
                showToast('标签不合理')
            }, 200)
        }

        if (!isChangeState) {
            const result = await setNote({ title, tag, date, content, brief })

            if (!result) showToast('保存失败')
            else {
                const addResult = await getLatestNote()

                if (!addResult) return showToast('')
                else {
                    noteStore().list.unshift(addResult)
                    noteStore().start++
                }
            }
        } else {
            let type = 0
            const updateContentArray = ['', '', '', '']

            if (tag !== originNoteState.originTag) {
                updateContentArray[0] = tag
                type++
            }
            if (title !== originNoteState.originTitle) {
                updateContentArray[1] = title
                type += 2
            }

            if (content !== originNoteState.originContent) {
                updateContentArray[2] = brief
                updateContentArray[3] = content
                type += 4
            }

            if (!type) return

            const result = await updateNoteInfo({
                type, updateTime: date, link: originNoteState.textLink, content: JSON.stringify(updateContentArray), isTextNote: 0
            })

            if (!result) return showToast('更新失败')
            else {
                const updateNoteIndex = noteStore().list.findIndex(v => {
                    return v.id === originNoteState.id
                })

                if (updateNoteIndex !== -1) {
                    noteStore().list[updateNoteIndex].tag = tag
                    noteStore().list[updateNoteIndex].title = title
                    noteStore().list[updateNoteIndex].updateTime = date
                    noteStore().list.unshift(noteStore().list.splice(updateNoteIndex, 1)[0])
                }
            }
        }

    }
    uni.setStorageSync('loaded', false)
    uni.setStorageSync('date', '')
    uni.setStorageSync('originTitle', '')
    uni.setStorageSync('originTag', '')
    uni.setStorageSync('originContent', '')
    uni.setStorageSync('textLink', '')
    uni.setStorageSync('id', '')
    uni.setStorageSync('shareDate', '')
    uni.setStorageSync('map-note', '')
})

recordTimer = setInterval(() => {
    uni.setStorageSync('map-note', {
        tag: tagInputRecord, title: titleInputRecord, content: [parentChildRelation,
            JSON.parse(JSON.stringify(floorList)), JSON.parse(JSON.stringify(itemInfo))]
    })

    uni.setStorageSync('isViewPage', isViewPage.value)
    uni.setStorageSync('isChangeState', isChangeState)
}, 20 * 1000)
</script>

<style lang="less" scoped>
.map-container {
    height: 100vh;
    display: flex;
    flex-direction: column;

    .info {
        position: fixed;
        left: 20px;
        font-size: 14px;
        color: var(--title);
        height: 70px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: calc(100vw - 40px);
        z-index: 2;

        .tag .tag-input,
        .title .title-input {
            outline: none;
            border: none;
            height: 40px;
            line-height: 40px;
            width: 100%;
        }

        .tag {
            width: 100%;
            display: flex;

            .tag-input {
                flex: 1;
            }
        }

        .tag,
        .title {
            position: relative;

            .identification {
                margin-right: 6px;
                opacity: .5;
            }

            &::after {
                content: '';
                position: absolute;
                bottom: 0px;
                left: 0;
                height: 1px;
                width: 100px;
                background-color: var(--line);
            }
        }

        .tag,
        .title {
            display: flex;
            align-items: center;
        }

    }

    .main-boy {
        width: 100%;
        flex: 1;
        position: relative;

        .movable-area {
            width: 10000px;
            height: 10000px;
            position: absolute;
            top: 0;
            right: 0;

            .movable-view {
                .map {
                    position: relative;

                    .control-floor {
                        display: flex;

                        .floor {
                            flex-shrink: 0;
                            position: relative;

                            .floorItem {
                                position: absolute;
                                width: 150px;
                                height: 50px;
                                display: flex;
                                align-items: center;
                                justify-content: flex-end;
                                left: 0;

                                .text {
                                    width: 100px;
                                    height: 30px;
                                    background-color: var(--map-background);
                                    color: var(--title);
                                    border-radius: 4px;
                                    line-height: 30px;
                                    text-align: center;
                                    font-size: 10px;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                }

                                .active {
                                    box-shadow: 0px 0px 4px 4px var(--map-background);
                                }

                                .link {
                                    color: var(--link-color);
                                }
                            }

                            .line {
                                position: absolute;
                                width: 50px;
                                z-index: -1;
                            }
                        }
                    }
                }
            }
        }

        .bottom-control {
            position: fixed;
            height: 100px;
            width: calc(100vw - 40px);
            left: 50%;
            transform: translateX(-50%);
            padding-top: 10px;

            .content-input {
                outline: none;
                width: 100%;
                border-radius: 4px;
                border: 1px solid var(--line);
                background-color: var(--background-color);
                color: var(--text);
                height: 36px;
                padding: 0 8px;
                box-sizing: border-box;
                margin: 0;
                line-height: 36px;
                font-size: 14px;
            }

            .input-link {
                color: var(--link-color);
            }

            .link-control {
                display: flex;
                justify-content: space-between;
                height: 36px;
                align-items: center;
                margin-top: 10px;
                position: relative;

                .icons {
                    display: flex;
                    align-items: center;
                    height: 36px;

                    .link-icon,
                    .location-icon {
                        display: block;
                        width: 20px;
                        height: 20px;
                    }

                    .link-icon {
                        margin-right: 10px;
                    }
                }

                .control {
                    display: flex;

                    .delete,
                    .add {
                        height: 30px;
                        line-height: 30px;
                        width: 90px;
                        text-align: center;
                        border-radius: 4px;
                        font-size: 12px;
                    }

                    .delete {
                        color: red;
                        background-color: #ff9999;
                        margin-right: 6px;
                    }

                    .add {
                        color: var(--condition-text);
                        background-color: var(--condition-background);
                    }
                }
            }
        }

        .lookPageTool {
            position: fixed;
            bottom: 50px;
            right: 30px;
            height: 40px;
            align-items: center;
            display: flex;
            background-color: var(--shallow);
            box-shadow: 2px 2px 6px var(--map-background);
            padding: 0 10px;
            justify-content: center;
            border-radius: 4px;

            .time,
            .tool-icon {
                padding: 0 8px;
            }

            .time {
                color: var(--text);
                font-size: 12px;
            }

            .tool-icon {
                display: block;
                width: 24px;
                height: 24px;
            }
        }
    }
}
</style>