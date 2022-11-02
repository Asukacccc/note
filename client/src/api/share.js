import request from '../fly/index'

async function setShareApi(obj) {
    const result = await request.post('/share/set', obj)

    return result
}

async function updateShareApi(obj) {
    const result = await request.post('/share/update', obj)

    return result
}

async function getShareNoteApi(id) {
    const result = await request.get('/share/mini', { noteId: id - 0})
    return result
}

async function getShareNoteListApi(time, length) {
    const result = await request.get('/share/list', { time, length })
    return result
}

async function deleteShareNote(noteId) {
    const result = await request.post('/share/delete', { noteId })
    return result
}

export { setShareApi, updateShareApi, getShareNoteApi, getShareNoteListApi, deleteShareNote }
