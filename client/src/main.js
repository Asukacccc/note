import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import UniIcons from "@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue"
import showToast from './utils/show-toast'

const app = createApp(App)

app.provide('showToast', showToast)
app.component('uni-icons', UniIcons)
app.use(createPinia()).mount('#app')
