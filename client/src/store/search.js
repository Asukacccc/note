import { defineStore } from 'pinia'

export default defineStore('search', {
    state: () => ({
        start: '',
        end: '',
        type: 0,
        isChange: false,
        timeRoughChoice: 0,
        lastId: 0,
        shareState: 2
    })
})