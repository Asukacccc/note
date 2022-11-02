<template>
    <view class="update-container" v-if="display">
        <mask-vue></mask-vue>
        <view class="main-body">
            <view class="info">
                <view class="name">{{ updateName }}</view>
                <input type="text" class="update-info-input" @input="updateInputFunc"/>
            </view>
            <view class="button">
                <view class="cancel" @click="clickCancel">取消</view>
                <view class="confirm" @click="clickConfirm">确认</view>
            </view>
        </view>
    </view>
</template>

<script setup>

import maskVue from './mask.vue'
import { toRefs } from 'vue'

function updateInputFunc(e) {
    inputValueRecord = e.detail.value
}

function clickConfirm() {
    emits('handlerResult', true, inputValueRecord)
}

function clickCancel() {
    emits('handlerResult', false)
}

const props = defineProps(['display', 'updateName'])
const { display, updateName } = toRefs(props)
const emits = defineEmits(['handlerResult'])
let inputValueRecord = ''

</script>

<style lang="less" scoped>

.update-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    z-index: 3;

    .main-body {
        margin: 100px auto 0;
        width: 300px;
        display: flex;
        justify-content: flex-end;   
        position: relative;     
        z-index: 1;
        flex-direction: column;

        .info {
            margin-bottom: 20px;


            .name {
                color: var(--title);
            margin-bottom: 10px;
            }

            .update-info-input {
                padding-left: 10px;
                height: 40px;
                width: 100%;
                background-color: var(--background-color);
                color: var(--title);
            }

        }

        .button {
            display: flex;
            justify-content: flex-end;

            .confirm, .cancel {
                width: 50px;
                height: 30px;
                text-align: center;
                line-height: 30px;
            }

            .confirm {
                margin-right: 10px;
                color: var(--text);
                background-color: var(--condition-background);
            }

            .cancel {
                color: var(--text);
                background-color: var(--background-color);
            }
        }
    }
}

</style>