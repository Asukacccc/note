import { getTagsList } from '../api/tags'
import noteStore from '../store/note'
import tagsStore from '../store/tags'

function deleteTags(tag) {
    const tags = tagsStore()
    const note = noteStore()

    const tagsStr = tags.preTagStr
    const replaceReg = new RegExp('(\\s|^)' + tag + '#\\d+', 'g')
    const replaceResult = tagsStr.replace(replaceReg, '')

    tags.preTagStr = replaceResult.trim()
    getTagsList(true)

    let list = note.list
    const noteListReplaceReg = new RegExp('(\\s|^)' + tag + '(\\s|$)', 'g')
    const noteListReplaceResult = (function() {
        return list.map(v => {
            v.tag = v.tag.replace(noteListReplaceReg, '').trim()
            return v
        })
    })()
    list = noteListReplaceResult
}

export default deleteTags