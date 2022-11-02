import { defineStore } from 'pinia'

export default defineStore('share', {
    state: () => ({
        noteId: '',
        isDelete: false,
        openShareDate: ''
    })
})