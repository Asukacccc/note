<template>
    <view class="share-container">
        <inner-nav-vue :title="share ? '修改访问限制' : '新建访问限制'"></inner-nav-vue>
        <confirm-vue title="是否删除该分享" :display="confirmBoxDisplay" @confirm-result="confirmResult"></confirm-vue>
        <view class="main-body">
            <view class="verification item" @click="verificationHandler">
                <view class="text">笔记访问验证码(4位)</view>
                <view class="value">{{ pageContainer.value || '无' }}</view>
            </view>
            <picker mode="date" :start="abortDate.dateStart" @change="abortDateChange" :end="abortDate.dateEnd"
                :value="abortDate.value">
                <view class="abort item">
                    <view class="text">访问截止期{{ isTimeout ? '(已过期)' : '' }}</view>
                    <view class="value">{{ abortDate.value }}</view>
                </view>
            </picker>
            <picker mode="selector" @change="accessStateChange" :range="accessState.range" :value="accessState.value">
                <view class="access item">
                    <view class="text">允许访问其他文本笔记或思维导图</view>
                    <view class="value">{{ accessState.range[accessState.value] }}</view>
                </view>
            </picker>
            <view class="delete item" @click="deleteHandler" v-if="share">
                <view class="text">删除笔记分享</view>
            </view>
        </view>
        <page-container :show="pageContainer.show" class="page-container">
            <view class="background-input">
                <inner-nav-vue :title="pageContainer.name" :isInterceptBack="true" @clickBackButton="clickBackButton">
                </inner-nav-vue>
                <input class="update-input" :value="pageContainer.originValue" type="text"
                    @input="updateBoxInputHandler" maxlength="4" />
                <view class="update-button" @click="confirmUpdateTextInfo">修改</view>
            </view>
        </page-container>
    </view>
</template>

<script setup>

import innerNavVue from '../../../component/common/inner-nav.vue'
import { ref, reactive } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import showToast from '../../../utils/show-toast'
import { setShareApi, updateShareApi, getShareNoteApi, deleteShareNote } from '../../../api/share'
import noteStore from '../../../store/note'
import confirmVue from '../../../component/common/confirm.vue'
import shareStore from '../../../store/share'

async function confirmResult(flag) {
    if (flag) {
        const deleteResult = await deleteShareNote(noteId)
        if (!deleteResult) return
        else {
            uni.navigateBack()
            showToast('删除分享成功')
            shareStore().isDelete = true
            shareStore().noteId = noteId
        }
    }

    confirmBoxDisplay.value = false
}

function abortDateChange(e) {
    abortDate.value = e.detail.value
    isTimeout.value = abortDate.value < Date.now()
}

function accessStateChange(e) {
    accessState.value = e.detail.value
}

function confirmUpdateTextInfo() {
    pageContainer.value = pageContainer.value.trim()

    if (pageContainer.value.length !== 4) return showToast('验证码应为4位')
    if (pageContainer.value.match(/[^a-zA-Z0-9]/)) return showToast('只能设定为字母或数字')

    clickBackButton()
}

function clickBackButton() {
    pageContainer.show = false
}

function verificationHandler() {
    pageContainer.show = true
}

function deleteHandler() {
    confirmBoxDisplay.value = true
}

function updateBoxInputHandler(e) {
    pageContainer.value = e.detail.value
}

function dateFormat(date, isStartTime = true) {
    if ((date + '').indexOf('-') === -1) {
        const standardDate = new Date(date - 0)
        const year = standardDate.getFullYear()
        const month = standardDate.getMonth() + 1
        const day = standardDate.getDate()

        return `${isStartTime ? year : year + 10}-${month > 9 ? month : '0' + month}-${day > 9 ? day : '0' + day}`
    } else {
        const temp = date.split('-').map((v, i) => {
            if (i === 1) return v - 1
            return v - 0
        })
        return new Date(...temp).getTime()
    }
}

const current = Date.now()
const pageContainer = reactive({
    name: '设定验证码',
    value: '',
    originValue: '',
    containerShow: false
})
const abortDate = reactive({
    dateStart: dateFormat(current),
    dateEnd: dateFormat(current, false),
})
const accessState = reactive({
    range: ['否', '是'],
})
let noteId = ''
const share = ref('')
const confirmBoxDisplay = ref(false)
const isTimeout = ref(false)

onLoad(async options => {
    noteId = options.id - 0
    share.value = options.shareDate

    if (share.value) {
        const result = await getShareNoteApi(noteId)

        if (!result) return
        else {
            abortDate.value = dateFormat(result.message.abortDate)
            abortDate.originValue = dateFormat(result.message.abortDate)
            accessState.value = result.message.access
            accessState.originValue = result.message.access
            pageContainer.value = result.message.verification
            pageContainer.originValue = result.message.verification

            isTimeout.value = result.message.abortDate < Date.now()
        }
    } else {
        abortDate.value = dateFormat(current)
        abortDate.originValue = dateFormat(current)
        accessState.value = 0
        accessState.originValue = 0
    }
})

onUnload(async () => {
    const isUpdate = share.value - 0

    if (!isUpdate) {
        const currentStr = Date.now() + ''
        const insertObj = {
            verification: pageContainer.value,
            abortDate: dateFormat(abortDate.value),
            access: accessState.value,
            noteId,
            current: currentStr
        }

        const addResult = await setShareApi(insertObj)
        if (!addResult) return
        else {
            const note = noteStore()
            const index = note.list.findIndex(v => v.id === noteId)

            note.list[index].shareDate = currentStr
            shareStore().openShareDate = currentStr

            showToast('已开放笔记')
        }
    } else {
        const updateObj = {}

        if (pageContainer.value !== pageContainer.originValue) {
            updateObj['verification'] = pageContainer.value
        }

        if (abortDate.value !== abortDate.originValue) {
            updateObj['abortDate'] = dateFormat(abortDate.value)
        }

        if (accessState.value !== accessState.originValue) {
            updateObj['access'] = accessState.value
        }

        if (!Reflect.ownKeys(updateObj).length) return

        updateShareApi({ noteId, content: updateObj })
        showToast('已修改笔记限制')
    }
})

</script>

<style lang="less" scoped>
.share-container {
    .main-body {
        .item {
            font-size: 14px;
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
            justify-content: space-between;

            .text,
            .value {
                height: 40px;
                line-height: 40px;
            }

            .value {
                margin-right: 18px;
                margin-left: 30px;
                max-width: 150px;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
                color: #3490de;
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
        }

        .verification {
            margin: 4px auto 0;
        }

        .delete {
            &::after {
                border-top: 1px solid red;
                border-right: 1px solid red;
            }
        }
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
        }
    }
}
</style>