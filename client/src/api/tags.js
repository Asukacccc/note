import request from '../fly/index'
import tagsStore from '../store/tags'

async function getTagsList(isUpdate = false) {
    let content = ''
    const tags = tagsStore()
    
    if (!isUpdate) {
        const result = await request.get('/tags/get')

        if (!result) return

        content = result.message
        tags.preTagStr = content
    } else {
        content = tags.preTagStr
    }

    const tagsArray = content.split(/#\d+\s?/)
    const total = {}
    const info = {}

    tagsArray.pop()

    function insert(obj, arr) {
        let temp = obj
        const origin = obj

        for (let i of arr) {
            temp[i] = {}
            temp = temp[i]

            if (!Reflect.has(info, i)) {
                info[i] = {}
                info[i]['open'] = false
            }
        }
        return origin
    }

    function check(obj, arr) {
        if (!arr.length) return

        const flag = Reflect.has(obj, arr[0])

        if (flag) {
            return check(obj[arr[0]], arr.slice(1))
        } else {
            return insert(obj, arr)
        }
    }

    for (let i of tagsArray) {
        const split = i.split('/')

        check(total, split)
        info[split[0]].arr = [split[0]]
    }

    tags.tagsList = total
    tags.listInfo = info
}

async function renameTagApi(obj) {
    const renameResult = await request.post('/tags/rename', obj)

    return renameResult
}

async function deleteTagApi(tag) {
    const result = await request.post('/tags/delete', { tag })

    return result
} 

export { getTagsList, renameTagApi, deleteTagApi }