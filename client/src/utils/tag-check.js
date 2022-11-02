import showToast from './show-toast'

function uniqueSymbolCheck(str) {
    const reg = /[^\u4E00-\u9FA5a-z-_\/\s+0-9A-Z]/

    return !str.match(reg)
}

function symbolLengthCheck(string) {
    let str = string.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ')
    let array = str.split(/\s/)

    array = array.filter(v => {
        const reg = /(?<=.?)\/$|^\/(?=.?)|^\/{2}$/
        return !v.match(reg)
    })

    const totalTagsNum = array.reduce((total, item) => {
        return total + item.split('/').length
    }, 0)

    if (totalTagsNum > 20) {
        return 1
    }

    for (let i of array) {
        const temp = i.split('/')

        for (let k of temp) {
            if (k.length > 10) return 2
        }
    }

    return 0
}

function tagValidCheck(str) {
    const uniqueCheckResult = uniqueSymbolCheck(str)

    if (!uniqueCheckResult) {
        showToast('不应含有_、-、/外特殊符号')
        return false
    }

    const lengthCheck = symbolLengthCheck(str)

    switch (lengthCheck) {
        case 1:
            showToast('总标签数不可多于20')
            return false
        case 2:
            showToast('单个标签长度不可多于10')
            return false
        default:
            return true
    }
}

export { tagValidCheck }