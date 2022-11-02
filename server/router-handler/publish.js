import db from '../database/index.js'

function setPublish(req, res) {
    const insertStr = 'insert into publish set ?'

    const { noteId, abortDate, verification, access, current }  = req.body
    const insertNote = 'update note set ? where openid = ? and id = ?'

    db.query(insertStr, { noteId, shareDate: current, access, openid: req.auth.openid, verification, abortDate: abortDate }, (err, insertResult) => {
        if (err) return res.cc(err)
        if (insertResult.affectedRows !== 1) return res.cc('insert into fail...')

        db.query(insertNote,[{ shareDate: current }, req.auth.openid, noteId], (error, noteResult) => {

            if (error) return res.cc(error)
            if (noteResult.affectedRows !== 1) return res.cc('insert note shareInfo fail')

            res.cc(insertResult.insertId, 0)
        })

    })
}

function updatePublish(req, res) {
    const { noteId, content } = req.body

    const updateStr = 'update publish set ? where noteId = ? and openid = ?'
    db.query(updateStr, [content, noteId, req.auth.openid], (err, updateResult) => {
        if (err) return res.cc(err)
        if (updateResult.affectedRows !== 1) return res.cc('update error...')

        res.cc('update success...', 0)
    })
}

function deletePublish(req, res) {
    const { noteId } = req.body
    const openid = req.auth.openid
    const deleteStr = 'delete from publish where noteId = ? and openid = ?'

    db.query(deleteStr, [noteId, openid], (err, deleteResult) => {
        if (err) return res.cc(err)
        if (deleteResult.affectedRows !== 1) return res.cc('delete error...')

        const queryStr = 'update note set ? where openid = ? and id = ?'

        db.query(queryStr, [{ shareDate: '' }, openid, noteId], (error, updateResult) => {
            if (error) return res.cc(error)
            if (updateResult.affectedRows !== 1) return res.cc('update shareDate not unique')

            res.cc('delete success...', 0)
        })
    })
}

function getInfoOnMini(req, res) {
    const noteId = req.query.noteId
    const openid = req.auth.openid
    const queryStr = 'select verification, abortDate, access from publish where noteId = ? and openid = ?'

    db.query(queryStr, [noteId, openid], (err, queryResult) => {
        if (err) return res.cc(err)
        if (queryResult.length !== 1) return res.cc('publish info  not unique')

        return res.cc(queryResult[0], 0)
    })
}

function getShareList(req, res) {
    const time = req.query.time
    const length = req.query.length - 0
    const openid = req.auth.openid
    let queryStr = 'select id, tag, title, shareDate, brief from note where openid = ? and shareDate > "0"'

    if (time) {
        queryStr += ` and shareDate < ${time}`
    }
    queryStr += ' order by shareDate desc limit 0, ?'

    db.query(queryStr, [openid, length], (err, queryResult) => {
        if (err) return res.cc(err)

        return res.cc(queryResult, 0)
    })
}

export { setPublish, updatePublish, deletePublish, getInfoOnMini, getShareList }