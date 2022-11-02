<template>
    <view class="info-container">
        <inner-nav-vue title="我的信息"></inner-nav-vue>
        <view class="main-body">
            <view class="avatar-item item" @click="updateAvatar">
                <view class="text">头像修改</view>
                <image :src="avatarUrl" class="avatar"></image>
            </view>
            <view class="name item" @click="updateNameSignature('name')">
                <view class="text">昵称修改</view>
                <view class="value">{{ name }}</view>
            </view>
            <view class="signature item" @click="updateNameSignature('signature')">
                <view class="text">签名修改</view>
                <view class="value">{{ signature }}</view>
            </view>
        </view>
        <page-container :show="pageContainerShowType" class="page-container">
            <view class="background-input">
                <inner-nav-vue :title="pageContainerName" :isInterceptBack="true" @clickBackButton="clickBackButton"></inner-nav-vue>
                <view v-show="pageContainerShowType === 1">
                    <image-crop-vue :src="imageSrc" cropRadio="1" :imageWidth="imageWidth"
                        :imageRadio="imageRadio" @getCropResult="getCropResult">
                    </image-crop-vue>
                </view>
                <view v-show="pageContainerShowType === 2">
                    <input class="update-input" :value="pageContainerInputValue" type="text"
                        @input="updateBoxInputHandler" :maxlength="updateType === 'name' ? 15 : 30"/>
                    <view class="update-button" @click="confirmUpdateTextInfo">修改</view>
                </view>
            </view>
        </page-container>
    </view>
</template>

<script setup>

import innerNavVue from '../../../component/common/inner-nav.vue'
import { storeToRefs } from 'pinia'
import userStore from '../../../store/user'
import request from '../../../fly/index'
import { computed, ref } from 'vue'
import imageCropVue from '../../../component/special/image-crop.vue'
import { updateUserInfo } from '../../../api/user'
import showToast from '../../../utils/show-toast'

async function getCropResult(res) {
    imageSrc.value = ''
    pageContainerShowType.value = 0

    const updateResult = await updateUserInfo('avatar', res.tempFilePath)
    if (updateResult) avatar.value = updateResult
}

function updateAvatar() {
    pageContainerShowType.value = 1
    pageContainerName.value = '修改头像'
    updateType.value = 'avatar'

    uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        success(chooseResult) {
            const item = chooseResult.tempFiles[0]

            uni.getImageInfo({
                src: item.tempFilePath,
                success(infoResult) {
                    imageSrc.value = infoResult.path
                    imageWidth.value = infoResult.width
                    cropDisplay.value = true
                    imageRadio.value = infoResult.width / infoResult.height
                }
            })
        },
        fail() {
            pageContainerShowType.value = 0
        }
    })
}

function updateNameSignature(type) {
    pageContainerShowType.value = 2
    updateType.value = type

    if (type === 'name') {
        pageContainerName.value = '修改昵称'
        pageContainerInputValue.value = name.value
    } else {
        pageContainerName.value = '修改签名'
        pageContainerInputValue.value = signature.value
    }
}

async function clickBackButton() {
    pageContainerShowType.value = 0
    
    if (updateType.value === 'avatar') imageSrc.value = ''
}

function updateBoxInputHandler(e) {
    const value = e.detail.value

    if (updateType.value === 'name' && value.length >= 15) showToast('昵称长度已达上限(15字)')
    if (updateType.value === 'signature' && value.length >= 30) showToast('签名长度已达上限(30字)')

    updateInputRecord = value
}

async function confirmUpdateTextInfo() {
    if (updateInputRecord === '') return
    if (updateType.value === 'name' && updateInputRecord === name.value) return 
    if (updateType.value === 'signature' && updateInputRecord === signature.value) return

    const updateResult = await updateUserInfo(updateType.value, updateInputRecord)
    if (!updateResult) return
    else {
        userStore()[updateType.value] = updateInputRecord
    }

    clickBackButton()
}

const { name, avatar, signature } = storeToRefs(userStore())
const pageContainerInputValue = ref()
const pageContainerShowType = ref(0)
const imageSrc = ref('')
const imageWidth = ref('')
const cropDisplay = ref(false)
const imageRadio = ref(1)
const pageContainerName = ref('')
const updateType = ref('')
let updateInputRecord = ''
const avatarUrl = computed(() => `${request.config.baseURL}/image/avatar/${avatar.value}`)

</script>

<style lang="less" scoped>
.info-container {
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

            &:first-child {
                margin: 4px auto 0;
            }

            .text,
            .value {
                height: 40px;
                line-height: 40px;
            }

            .value {
                margin-right: 18px;
                width: 100px;
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

            .avatar {
                display: block;
                width: 80px;
                height: 100px;
                box-sizing: border-box;
                padding: 10px 0;
            }
        }

        .avatar-item {
            .text {
                align-self: flex-start;
            }

            &::after {
                display: none;
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


