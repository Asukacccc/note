import { defineStore } from "pinia"

export default defineStore('list', {
    state: () => ({
        list: [],
        start: 0,
        length: 10,
        tempList: [],
        tagRequestStart: 0,
        tagRequestLength: 10,
        firstRequestLength: 0,
        isOver: false
    })
})