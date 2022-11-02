import request from '../fly/index.js'
import searchStore from '../store/search.js'

async function searchTagTitleBrief(content, length) {
    const requestObj = {}
    const search = searchStore()
    requestObj.content = content
    requestObj.start = search.start
    requestObj.end = search.end
    requestObj.type = search.type
    requestObj.id = search.lastId
    requestObj.length = length || 10
    requestObj.share = search.shareState

    const result = await request.get('/search/note', requestObj)

    if (!result) return
    
    return result
}

export { searchTagTitleBrief }