import { defineStore } from 'pinia'

export default defineStore('tags', {
    state: () => ({
        tagsList: {},
        listInfo: {}
    })
})