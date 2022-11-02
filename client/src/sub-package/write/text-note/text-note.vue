<template>
    <view class="text-container">
        <inner-nav-vue title="创建文本笔记"></inner-nav-vue>
        <view class="main-body" :style="{ height: `calc(100vh - ${ (isViewPage ? 0 : 42) + topBarHeight }px)` }">
            <view class="tag">
                <view class="identification">#</view>
                <input type="text" :style="{ color: inputValueError ? '#f38181' : '' }" class="tagInput"
                    :disabled="isViewPage" :value="tagValue" @input="tagInputHandler" placeholder="此处输入标签, 空格划分, /指定从属"
                    @blur="tagBlur">
            </view>
            <editor class="editor" id="text-editor" @ready="editorFuncs" @statuschange="editorFuncs" v-if="!isViewPage"
                @input="editorFuncs" :style="{ height: `calc(100% - 80px)` }" placeholder="在此输入..."></editor>
            <scroll-view scroll-y class="displayContent" v-else :style="{ height: `calc(100% - 70px)` }"
                :show-scrollbar="false" :enhanced="true">
                <mp-html :content="textContentHtml" @linktap="mpHtmlClick" @load="mpHtmlLoaded"
                    container-style="word-break: break-all"></mp-html>
            </scroll-view>
        </view>
        <view class="bottomControl" :style="{ bottom: '0' }" v-if="!isViewPage">
            <image class="link item" :src="darkMode ? '/static/link-black.png' : '/static/link-white.png'"
                @touchend.stop="addLink"></image>
            <image class="list item" :src="listPicturePath" @touchend.stop="addList">
            </image>
            <image class="picture item" :src="darkMode ? '/static/picture-black.png' : '/static/picture-white.png'"
                @touchend.stop="addPicture">
            </image>
            <view class="title item" @touchend.stop="titleFormat" :style="{ color: `${ titleColor }` }">T</view>
            <view class="bold item" :style="{ color: `${ boldColor }` }" @touchend.stop="boldFormat">B</view>
            <image class="clear item" :src="darkMode ? '/static/clear-black.png' : '/static/clear-white.png'"
                @touchend="clearFormat"></image>
        </view>
        <view class="lookPageTool" v-else>
            <view class="time" v-html="changeDateFormat()"></view>
            <image class="tool-icon" src="/static/share.png" @click="shareHandler"></image>
            <image class="tool-icon" src="/static/edit.png" @click="offViewState"></image>
        </view>
    </view>
</template>

<script setup>

import innerNavVue from '../../../component/common/inner-nav.vue'
import system from '../../../store/system'
import { storeToRefs } from 'pinia'
import { getCurrentInstance, ref, watch } from 'vue'
import '../../../styles/editor-image.css'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import linkStore from '../../../store/link'
import showToast from '../../../utils/show-toast'
import { tagValidCheck } from '../../../utils/tag-check'
import { uploadTextNotePicture, setNote, getLatestNote, getNoteContent, getNotePartInfo, updateNoteInfo } from '../../../api/note'
import request from '../../../fly/index'
import noteStore from '../../../store/note'
import mpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html'
import dateConversion from '../../../utils/date-conversion'
import shareStore from '../../../store/share'

function shareHandler() {
    uni.navigateTo({
        url: `/sub-package/write/share/share?id=${noteOriginState.id}&shareDate=${noteOriginState.shareDate}`
    })
}

function changeDateFormat() {
    const infoArray = dateConversion(date.value)
    return `${infoArray[0]} ${infoArray[0] ? '- ' : ' '}<span style="font-weight:bold">${infoArray[1]}</span>`
}

function offViewState() {
    isChangeState = true
    isViewPage.value = false
    textContentHtml.value = textContentHtml.value.replace('<img src="http', '<img class="editorImage" src="http')
    uni.setStorageSync('isViewPage', false)
}

function mpHtmlLoaded() {
    mpHtmlComponentLoaded = true
}

async function mpHtmlClick(e) {
    if (mpHtmlComponentLoaded) {
        const id = e.style.match(/(?<=serif-)\d+(?=;?)/)[0]
        const result = await getNotePartInfo(id)

        if (!result) return
        else {
            const isMapNote = result.message.title

            if (isMapNote) {
                uni.navigateTo({
                    url: `/sub-package/write/map-note/map-note?loadType=0&` +
                        `id=${id}&title=${result.message.title}&tag=${result.message.tag}&textLink=${result.message.textLink}`
                })
            } else {
                uni.navigateTo({
                    url: `/sub-package/write/text-note/text-note?loadType=0&` +
                        `id=${id}&tag=${result.message.tag}&textLink=${result.message.textLink}`
                })
            }
        }
    }
}

function tagBlur() {
    const result = tagValidCheck(inputValueRecord)

    if (result) {
        inputValueError.value = false
    } else {
        inputValueError.value = true
    }
}

function tagInputHandler(e) {
    inputValueRecord = e.detail.value
}

function editorInput(e) {

}

function addPicture() {
    uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        success(res) {
            const path = res.tempFiles[0].tempFilePath

            editor.insertImage({
                src: path,
                extClass: 'editorImage',
                nowrap: false
            })
        }
    })
}

function clearFormat() {
    editor.removeFormat()
}

function editorFuncs(e) {
    const type = e.type

    switch (type) {
        case 'ready':
            editorReady()
            break
        case 'statuschange':
            editorStatusChange(e)
            break
        case 'input':
            editorInput(e)
            break
    }
}

function titleFormat() {
    const { header } = formats

    if (header) {
        editor.format('header', '')
    } else {
        editor.format('header', 'h3')
    }
}

function boldFormat() {
    const { bold } = formats
    bold ? editor.format('bold', '') : editor.format('bold', 'bolder')
}

function addLink() {
    selectNoteClosePage = true
    uni.navigateTo({ url: '/sub-package/search/search/search' })
}

function addList() {
    const { list } = formats
    list ? editor.format('list', '') : editor.format('list', 'bullet')
}

function editorStatusChange(e) {
    formats = e.detail
    const { list, bold, header } = formats

    if (list) {
        listPicturePath.value = '/static/text-list-selected.png'
    } else {
        listPicturePath.value = darkMode.value ? '/static/text-list-black.png' : '/static/text-list-white.png'
    }

    if (bold) {
        boldColor.value = '#4686F7'
    } else {
        boldColor.value = 'var(--title)'
    }

    if (header === 1) {
        editor.format('header', '')
        titleColor.value = 'var(--title)'
    } else {
        if (header) {
            titleColor.value = '#4686F7'
        } else {
            titleColor.value = 'var(--title)'
        }
    }
}

function editorReady(e) {
    if (!isViewPage.value) {
        uni.createSelectorQuery().in(instance).select('#text-editor').context(res => {
            editor = res.context

            editor.setContents({
                html: textContentHtml.value,
                success() {
                    isChangeState ? editor.blur() : ''
                }
            })
        }).exec()
    }
}

const { darkMode, statusBarHeight, navigatorBarHeight } = storeToRefs(system())
const topBarHeight = statusBarHeight.value + navigatorBarHeight.value
const instance = getCurrentInstance()
const keyBoardHeight = ref(0)
let editor
let formats = {}
const listPicturePath = ref(darkMode.value ? '/static/text-list-black.png' : '/static/text-list-white.png')
const titleColor = ref('var(--title)')
const boldColor = ref('var(--title)')
const tagValue = ref('')
let inputValueRecord = ''
let selectNoteClosePage = false
let textColor = system().darkMode ? '#9A9A9A' : '#707077'
let recordTimer
const inputValueError = ref(false)
const isViewPage = ref(false)
const textContentHtml = ref('')
let mpHtmlComponentLoaded = false
let noteOriginState = {}
let isChangeState = false
const date = ref('')
const share = shareStore()
const note = noteStore()

uni.onKeyboardHeightChange(res => {
    if (!editor) return

    keyBoardHeight.value = res.height
    uni.pageScrollTo({ scrollTop: 0 })
    editor.scrollIntoView()
})

onLoad(async options => {
    uni.setStorageSync('loaded', true)

    const loadType = options.loadType - 0

    if (loadType === 1) {
        const noteInfo = uni.getStorageSync('text-note')
        isViewPage.value = uni.getStorageSync('isViewPage')
        tagValue.value = noteInfo['tag']
        inputValueRecord = tagValue.value
        isChangeState = uni.getStorageSync('isChangeState')
        date.value = uni.getStorageSync('date')

        textContentHtml.value = noteInfo['content']
        noteOriginState.tag = tagValue.value
        noteOriginState.textLink = uni.getStorageSync('link')
        noteOriginState.id = uni.getStorageSync('noteId') - 0
        noteOriginState.shareDate = uni.getStorageSync('shareDate')
        noteOriginState.originTag = uni.getStorageSync('tag')
        noteOriginState.originContent = uni.getStorageSync('content')
        tagBlur()
    } else if (loadType === 0) {
        tagValue.value = options.tag
        isViewPage.value = true
        date.value = options.updateTime

        uni.setStorageSync('isViewPage', true)
        uni.setStorageSync('link', options.textLink)

        const textContent = await getNoteContent(options.textLink)

        if (!textContent) return
        else {
            let tempText = textContent.message

            const reg = /<(span)( style="font-family: serif-\d+; color: rgb\(0, 187, 240\);">)(.+?)(<\/\1>)/g
            const reg1 = /<(span)( style="color: rgb\(0, 187, 240\); font-family: serif-\d+;">)(.+?)(<\/\1>)/g
            
            tempText = tempText.replace(reg, (...arr) => {
                return `<a${arr[2]}${arr[3]}</a>`
            }).replace(reg1, (...arr) => {
                return `<a${arr[2]}${arr[3]}</a>`
            })

            textContentHtml.value = tempText
            noteOriginState.textLink = options.textLink
            noteOriginState.tag = options.tag
            inputValueRecord = noteOriginState.tag
            noteOriginState.content = textContent.message
            noteOriginState.id = options.id - 0
            noteOriginState.shareDate = options.shareDate

            uni.setStorageSync('tag', options.tag)
            uni.setStorageSync('content', textContent.message)
            uni.setStorageSync('date', date.value)
            uni.setStorageSync('noteId', noteOriginState.id)
            uni.setStorageSync('shareDate', noteOriginState.shareDate)
        }
    }
})

onShow(async () => {
    if (selectNoteClosePage) {
        if (!linkStore().linkId) {
            showToast('尚未选择链接笔记')
        } else {
            if (!editor) return

            await new Promise(resolve => {
                editor.format('fontFamily', `serif-${linkStore().linkId}`)
                editor.insertText({
                    text: '',
                    success() {
                        resolve()
                    }
                })
            })

            await new Promise(resolve => {
                editor.format('color', '#00bbf0')
                editor.insertText({
                    text: '@链接',
                    success() {
                        editor.format('color', textColor)
                        resolve()
                    }
                })
            })

            editor.format('fontFamily', ``)
            editor.insertText({ text: ' ' })
            linkStore().linkId = ''
        }
        selectNoteClosePage = false
    }

    if (share.isDelete) {
        share.isDelete = false

        uni.setStorageSync('shareDate', '')
        noteOriginState.shareDate = ''

        const item = note.list.find(v => v.id === noteOriginState.id - 0)
        item && (item['shareDate'] = '')
    }
})

onUnload(() => {
    clearInterval(recordTimer)
    tagBlur()

    if (!isViewPage.value) {
        editor.getContents({
            async success(res) {
                async function upload() {
                    if (pictureSet) {
                        for (let i = 0; i < pictureSet.length; i++) {
                            const uploadResult = await uploadTextNotePicture(pictureSet[i], i, date).catch(err => err)

                            if (uploadResult instanceof Error) return false

                            content = content.replace(`<img src="${pictureSet[i]}" data-local="${pictureSet[i]}" class="editorImage">`,
                                `<img src="${request.config.baseURL + '/image/note/' + uploadResult}" 
                                style="display: block;width: calc(100% - 70px);margin: 10px auto;position: relative;">`)
                        }
                    }

                    return true
                }

                const brief = res.text.slice(0, 50).replace(/\s$/, '')

                if (brief.length === 0) {
                    return showToast('内容为空, 不进行保存')
                }

                let content = res.html
                const reg = /(?<=\<img\ssrc=").+?(?="\sdata-local=")/g
                const pictureSet = content.match(reg)
                const date = Date.now()
                const tag = inputValueError.value ? '' : [...new Set(inputValueRecord.split(' '))].join(' ').replace(/\/+/g, '/')
                const title = ''

                if (inputValueError.value) {
                    setTimeout(() => {
                        showToast('标签不合理')
                    }, 200)
                }

                if (!isChangeState) {
                    const uploadResult = await upload()

                    if (!uploadResult) return

                    const saveResult = await setNote({ title, tag, date, content, brief })

                    if (!saveResult) return
                    else {
                        const addResult = await getLatestNote()

                        if (!addResult) return showToast('')
                        else {
                            noteStore().list.unshift(addResult)
                            noteStore().start++
                        }
                    }
                } else {
                    const updateObj = ['', '', '', '']
                    let type = 0

                    if (tag !== noteOriginState.originTag) {
                        type++
                        updateObj[0] = tag
                    }

                    if (content !== noteOriginState.originContent) {
                        type += 4
                        updateObj[2] = brief
                        updateObj[3] = content
                    }

                    if (!type) return

                    const updateResult = await updateNoteInfo({
                        type, updateTime: date, link: noteOriginState.textLink, content: JSON.stringify(updateObj), isTextNote: 1
                    })

                    if (!updateResult) return
                    else {
                        const updateNoteIndex = noteStore().list.findIndex(v => {
                            return v.id === noteOriginState.id
                        })

                        if (updateNoteIndex !== -1) {
                            noteStore().list[updateNoteIndex].tag = tag
                            noteStore().list[updateNoteIndex].title = title
                            noteStore().list[updateNoteIndex].updateTime = date
                            noteStore().list[updateNoteIndex].brief = brief
                            noteStore().list.unshift(noteStore().list.splice(updateNoteIndex, 1)[0])
                        }
                    }
                }
            }
        })
    }
    uni.setStorageSync('loaded', false)
    uni.setStorageSync('content', '')
    uni.setStorageSync('tag', '')
    uni.setStorageSync('text-note', '')
    uni.setStorageSync('link', '')
    uni.setStorageSync('date', '')
    uni.setStorageSync('shareDate', '')
})

watch(() => share.openShareDate, () => {
    noteOriginState.shareDate = share.openShareDate
    uni.setStorageSync('shareDate', share.openShareDate)
})

onHide(() => {
    share.openShareDate = ''
})

recordTimer = setInterval(() => {
    if (!isViewPage.value) {
        if (!editor) return

        editor.getContents({
            success(res) {
                uni.setStorageSync('text-note', { tag: inputValueRecord, content: res.html })
                uni.setStorageSync('isChangeState', isChangeState)
            }
        })
    }
    else {
        uni.setStorageSync('text-note', { tag: tagValue.value, content: textContentHtml.value })
    }
}, 20 * 1000)

</script>

<style lang="less" scoped>
.text-container {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: var(--title);

    .main-body {
        display: flex;
        flex-direction: column;
        align-items: center;

        .tag {
            margin-top: 10px;
            display: flex;
            width: calc(100vw - 30px);
            position: relative;
            height: 30px;

            &::after {
                position: absolute;
                content: '';
                bottom: 0;
                left: 0;
                width: 120px;
                height: 1px;
                background-color: var(--line);
            }

            .identification {
                width: 20px;
                height: 30px;
                text-align: center;
                align-items: center;
                opacity: .5;
                line-height: 30px;
            }

            .tagInput {
                flex: 1;
                height: 30px;
                font-size: 14px;
            }
        }

        .editor,
        .displayContent {
            flex-shrink: 0;
            font-size: 14px;
            line-height: 24px;
            margin-top: 30px;
            width: calc(100vw - 30px);
            color: var(--text);
        }
    }

    .bottomControl {
        position: fixed;
        left: 0;
        width: 100vw;
        height: 42px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        padding-left: 20px;
        background-color: var(--shallow);

        .link,
        .list,
        .picture,
        .clear {
            width: 20px;
            height: 20px;
            display: block;
        }

        .item:not(:last-child) {
            margin-right: 20px;
        }

        .title,
        .bold {
            font-size: 20px;
            font-weight: bolder;
            width: 20px;
            height: 20px;
            line-height: 20px;
            text-align: center;
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
        justify-content: space-between;
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
</style>

