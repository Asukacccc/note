<template>
    <view class="more-container" v-show="display" @click.stop="close">
        <view class="background"></view>
        <view class="list" :style=styleObj>
            <view class="item" v-for="v in list" @click="itemHandler(v.id)" :key="v.id"
                :style="{ color: v.important ? 'red' : 'var(--title)' }">{{ v.name }}</view>
        </view>
    </view>
</template>

<script setup>

import { useAttrs, toRefs, ref, watch } from 'vue'
import systemStore from '../../store/system'

function itemHandler(id) {
    idRecord = id
    emits('execute', id)
}

function close() {
    emits('closeMoreShow', idRecord)
}

const attrs = useAttrs()
const { display, list, top, left } = toRefs(attrs)
const emits = defineEmits(['closeMoreShow', 'execute'])
const { screenHeight } = systemStore() 
const styleObj = ref({})
let idRecord = undefined

watch([top, left, display], () => {
    styleObj.value = {}
    idRecord = undefined

    if (top.value + 50 >= screenHeight / 2) {
        styleObj.value.bottom = `${ screenHeight - top.value - 30 }px`
    } else {
        styleObj.value.top = `${ top.value }px`
    }

    styleObj.value.left = `${ left.value - 85 }px`
}, { immediate: true })

</script>
<style scoped lang="less">
.more-container {
    .background {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        z-index: 1;
    }

    .list {
        box-shadow: 0px 0px 3px 3px var(--map-background);
        position: fixed;
        background-color: var(--background-color);
        border-radius: 4px;
        z-index: 1;

        .item {
            font-size: 14px;
            width: 90px;
            height: 40px;
            line-height: 40px;
            text-align: center;
            position: relative;

            &:hover {
                &::after {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: -1;
                    width: 80px;
                    height: 30px;
                    background-color: var(--map-background);
                    content: '';
                    filter: blur(10px);
                }
            }
        }
    }
}
</style>