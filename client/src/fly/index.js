import Fly from 'flyio/dist/npm/wx'
import { getToken } from '../api/user'

const instance = new Fly
instance.config.baseURL = 'http://127.0.0.1'

let requestArray = []
let allowArray = []

instance.interceptors.request.use(config => {
    uni.showLoading({
        title: '加载中...',
        mask: true
    })

    const isRequesting = requestArray.some(item => item === config.url)

    if (allowArray.indexOf(config.url) === -1) {
        if (isRequesting) {
            uni.hideLoading()
            return Promise.resolve({ message: 'interrupt request', status: 1 })
        }
        else {
            requestArray.push(config.url)
        }
    }

    const token = uni.getStorageSync('token')

    if (token) {
        config.headers.Authorization = token
    }

    return config
}, err => {
    uni.hideLoading()
    return Promise.reject(err.message)
})

instance.interceptors.response.use(response => {
    if (response.data.message === 'Certification fail') {
        const url = response.request.url
        const method = response.request.method
        const params = response.request.params
        const body = response.request.body

        const res = getToken(async () => {
            return await instance.request(url, body || params, { method }).catch(err => err)
        })

        requestArray = requestArray.filter(item => item !== url)
        uni.hideLoading()
        return res
    }

    requestArray = requestArray.filter(item => item !== response.request.url)
    uni.hideLoading()

    if (response.data.status - 0) {
        console.log(response.data.message);

        setTimeout(() => {
            uni.showToast({ icon: 'none', title: '出错了...' })
        }, 200)

        return false
    }
    else { return response.data }
}, err => {
    uni.showToast({
        icon: 'none',
        title: '请求失败'
    })

    requestArray = []
    uni.hideLoading()
    Promise.reject(err.message)
})

export default instance