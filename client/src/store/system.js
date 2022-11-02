import { defineStore } from 'pinia'

export default defineStore('system', {
    state: () => ({
        screenWidth: 0,
        screenHeight: 0,
        statusBarHeight: 0,
        navigatorBarHeight: 0,
        availableHeight: 0,
        darkMode: false,
        isIOS: false
    })
})