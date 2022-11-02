import { getTagsList } from '../api/tags'
import noteStore from '../store/note'
import tagStore from '../store/tags'

function updateTagName(oldTag, newTag) {
    const note = noteStore()
    const tags = tagStore()
    let totalStr = tags.preTagStr
    const regStr = new RegExp('(?<=(\\s|^))' + oldTag + '(?=(\\/|#))', 'g')
    const checkIsExist = new RegExp('(?<=(\\s|^))' + newTag + '(?=#)')

    if (totalStr.match(checkIsExist)) {
        const preDeleteTagNumberReg = new RegExp(`(?<=(\\s|^)${oldTag}#)\\d+(?=($|\\s))`)
        const preMergeTagNumberReg = new RegExp(`(?<=(\\s|^)${newTag}#)\\d+(?=($|\\s))`)
        const deleteTagNumber = totalStr.match(preDeleteTagNumberReg)[0]
        const mergeTagNumber = totalStr.match(preMergeTagNumberReg)[0]
        const deleteReg = new RegExp(`(\\s|^)${oldTag}#\\d+`)

        totalStr = totalStr.replace(deleteReg, '')
        totalStr = totalStr.replace(preMergeTagNumberReg, (deleteTagNumber - 0) + (mergeTagNumber - 0))
    }

    else totalStr = totalStr.replace(regStr, newTag)

    tags.preTagStr = totalStr
    getTagsList(true)

    let list = note.list
    const noteListReg = new RegExp('(?<=(\\s|^))' + oldTag + '(?=(\\/|$|\\s))', 'g')

    list = list.map(v => {
        if (v.tag.match(noteListReg)) {
            v.tag = v.tag.replace(noteListReg, newTag)
            v.tag = [...new Set(v.tag.split(' '))].join(' ')
        }
        return v
    })
}

export { updateTagName }