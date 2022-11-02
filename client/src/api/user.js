import request from '../fly'
import userStore from '../store/user'

function getToken(callback) {
    return new Promise((resolve, reject) => {
        uni.login({
            async success(res) {
                const result = await request.post('/user/openid', { code: res.code })

                if (!result) {
                    return uni.showToast({
                        title: '用户验证失败',
                        duration: 1500
                    })
                }
                uni.setStorageSync('token', result.message)

                const cbResult = callback && callback()

                resolve(cbResult)
            },
            fail() {
                uni.showToast({
                    icon: 'none',
                    title: '登录失败'
                })

                reject(new Error())
            }
        })
    })
}

async function getUserInfo() {
    const result = await request.get('/user/get')

    if (!result) return

    const user = userStore()
    user.name = result.message.name
    user.avatar = result.message.avatar
    user.signature = result.message.signature
}

async function updateUserInfo(type, content, again = false) {
    if (!token) {
        await getToken()
        token = uni.getStorageSync('token')
    }

    if (type === 'avatar') {
        const result = await new Promise((resolve, reject) => {
            uni.uploadFile({
                url: `${request.config.baseURL}/user/update`,
                name: 'image',
                filePath: content,
                formData: {
                    type
                },
                header: {
                    Authorization: token
                },
                success({ data }) {
                    const message = JSON.parse(data).message

                    if (message === 'Certification fail' && !again) {
                        token = ''
                        updateUserInfo(type, content, true)
                    }

                    resolve(message)
                },
                fail(err) {
                    reject(new Error(err))
                }
            })
        }).catch(err => err)

        if (result instanceof Error) return false
        else return result
    } else {
        const result = await request.post('/user/update', { type, content })
        return result
    }
}

let token = uni.getStorageSync('token')

export { getToken, getUserInfo, updateUserInfo }