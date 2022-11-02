import { defineStore } from "pinia"

export default defineStore('user', {
    state: () => ({
        name: '',
        signature: '',
        avatar: ''
    })
})