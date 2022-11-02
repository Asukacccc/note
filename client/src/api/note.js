import request from '../fly'
import listPinia from '../store/note'
import showToast from '../utils/show-toast'

async function getNote(num) {
    const listStore = listPinia()
    const { list, start, length } = listStore
    const result = await request.get('/note/get', { start, length: num || length })

    if (!result) return

    listStore.list = [...list, ...result.message]
    listStore.start += result.message.length

    if (result.message.length < length) {
        showToast('数据加载完毕')
        return true
    }
}

async function getNoteByTag(tag) {
    const listStore = listPinia()
    const { list } = listStore
    const id = (function () {
        let minId = list[0].id

        for (let i of list) {
            if (i.id < minId) minId = i.id
        }

        return minId
    })()
    const currentExist = (function () {
        if (listStore.tagRequestStart) {
            return listStore.list
        } else {
            const regExp = new RegExp('(?<=(\\s|^|\\/))' + tag + '(?=(\\s|$|\\/))')

            listStore.tempList = list
            return list.filter(v => {
                return v.tag.match(regExp)
            })
        }
    })()

    let start = listStore.tagRequestStart, length

    length = start ? listStore.tagRequestLength : listStore.firstRequestLength

    const result = await request.get('/tags/detail', { tag, id, start, length })

    if (!result) return

    listStore.list = [...currentExist, ...result.message]
    listStore.tagRequestStart += result.message.length

    if (result.message.length < length) {
        showToast('数据加载完毕')

        return true
    }
}

async function setNote(obj) {
    const result = await request.post('/note/set', obj)

    if (!result) return false
    if (result.message === 'tags over 700...') {
        showToast('总标签数已达上限700个')
    }
    if (result.message.indexOf('quantity over 700...') !== -1) {
        showToast(result.message.split('...')[1] + '便签携带数已达上限700个')
    }

    return result
}

async function getLatestNote() {
    const result = await request.get('/note/latest')

    if (!result) return false
    else return result.message
}

function uploadTextNotePicture(filePath, index, date, again = false) {
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: `${request.config.baseURL}/note/upload`,
            name: 'image',
            filePath,
            formData: {
                index,
                date
            },
            header: {
                Authorization: token
            },
            success({ data }) {
                const message = JSON.parse(data).message

                if (message === 'Certification fail' && !again) {
                    token = ''
                    uploadTextNotePicture(filePath, index, date, true)
                }

                resolve(message)
            },
            fail() {
                reject(new Error())
            }
        })
    })
}

async function getNoteContent(textLink) {
    const result = await request.get('/note/content', { textLink })

    return result
}

async function getNotePartInfo(id) {
    const result = await request.get('/note/part', { id })

    return result
}

async function updateNoteInfo(obj) {
    const result = await request.post('/note/update', obj)

    return result
}

async function deleteNoteAPi(obj) {
    const result = request.post('/note/delete', obj)

    return result
}

const token = uni.getStorageSync('token')

export { getNote, getNoteByTag, setNote, getLatestNote, uploadTextNotePicture, getNoteContent, getNotePartInfo, updateNoteInfo, deleteNoteAPi }