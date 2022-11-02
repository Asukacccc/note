import db from '../database/index.js'

function getList(req, res) {
    const queryStr = 'select tags from tags where openid = ?'
    const openid = req.auth.openid

    db.query(queryStr, openid, (err, queryResult) => {
        if (err) return res.cc(err)
        if (!queryResult[0]) return res.cc('', 0)

        res.cc(queryResult[0].tags.trim(), 0)
    })
}

async function  deleteTagRecord(req, res) {
    const tag = req.body.tag
    const openid = req.auth.openid
    const queryTagsStr = 'select tags from tags where openid = ?'
    const regStr = new RegExp('\\s' + tag + '#\\d+\\s?')
    const updateTagsTable = await new Promise((resolve, reject) => {

        db.query(queryTagsStr, openid, (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length === 0) return reject('data error...')

            const newTagsStr = queryResult[0].tags.replace(regStr, '')
            const updateStr = 'update tags set ? where openid = ?'

            db.query(updateStr, [{ tags: newTagsStr }, openid], (error, updateResult) => {

                if (error) return res.cc(error)
                if (updateResult.affectedRows !== 1) return reject('data error...')

                resolve()
            })
        })
    }).catch(err => err)

    if (updateTagsTable instanceof Error) return res.cc(updateTagsTable)

    const queryNote = 'select id, tag from note where ' +
        'openid = ? and (tag like ? or tag = ? or tag like ? or tag like ?)'
    const updateNoteTable = await new Promise((resolve, reject) => {

        db.query(queryNote, [openid, `% ${tag} %`, tag, `${tag} %`, `% ${tag}`], (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length === 0) return reject('data error...')

            queryResult = queryResult.map(v => {
                v.tag = v.tag.replace(tag, '').replace(/^\s|\s$/, '').replace('  ', ' ')

                return v
            })

            let updateStr = 'update note set tag = case id '

            for (let i of queryResult) {
                updateStr += `when ${i.id} then '${i.tag}' `
            }

            updateStr += `end where id in (${ queryResult.map(v => v.id).toString()})`

            db.query(updateStr, (error, updateResult) => {
                if (error) return reject(error)
                if (updateResult.affectedRows === 0) return reject('data error...')

                resolve()
            })
        })
    }).catch(err => err)

    if (updateNoteTable instanceof Error) return res.cc(updateNoteTable)

    res.cc('delete success', 0)
}

function getNoteByTag(req, res) {
    const openid = req.auth.openid
    const tag = req.query.tag
    const id = req.query.id
    const queryStr =
        'select id, title, tag, brief, imageCount, updateTime, textLink from note where ' +
        'openid = ? and (tag like ? or tag = ? or tag like ? or tag like ?) and id < ? order by id desc limit ?, ?'
    const { start, length } = req.query
    const queryCondition = [`% ${tag} %`, tag, `${tag} %`, `% ${tag}`, id, start - 0, length - 0]

    db.query(queryStr, [openid, ...queryCondition], (err, queryResult) => {
        if (err) return res.cc(err)

        res.cc(queryResult, 0)
    })
}

async function renameTags(req, res) {
    const oldTag = req.body.oldTag
    const newTag = req.body.newTag
    const openid = req.auth.openid

    const updateNoteTag = await new Promise((resolve, reject) => {
        const queryStr = 'select id, tag from note where' +
            ' openid = ? and (tag like ? or tag like ? or tag = ? or tag like ? or tag like ? or tag like ?)'
        const queryCondition = [`% ${oldTag}/%`, `${oldTag}/%`, oldTag, `% ${ oldTag } %`, `% ${ oldTag }`, `${ oldTag } %`]

        db.query(queryStr, [openid, ...queryCondition], (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length === 0) return reject(new Error('data error...'))

            queryResult = queryResult.map(v => {
                let tagArray = v.tag.split(' ')
                const regStr = new RegExp('(?<=(\\s|^))' + oldTag + '(?=(\\/|$|\\s))', 'g')

                tagArray = tagArray.map(item => item.replace(regStr, newTag))
                tagArray = [...new Set(tagArray)]
                v.tag = tagArray.join(' ')
                return v
            })

            let updateStr = 'update note set tag = case id '

            for (let i of queryResult) {
                updateStr += `when ${i.id} then '${i.tag}' `
            }

            updateStr += `end where id in (${queryResult = queryResult.map(v => v.id).toString()})`

            db.query(updateStr, (error, updateResult) => {
                if (error) return reject(error)
                if (updateResult.affectedRows === 0) return reject(new Error('data error...'))

                resolve()
            })
        })
    }).catch(err => err)

    if (updateNoteTag instanceof Error) return res.cc(updateNoteTag)

    const updateTotal = await new Promise((resolve, reject) => {
        const queryStr = 'select tags from tags where openid = ?'

        db.query(queryStr, openid, (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length === 0) return reject(new Error('data error...'))

            let totalStr = queryResult[0].tags
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

                const isOverQuality = deleteTagNumber - 0 + mergeTagNumber - 0 > 700
                if (isOverQuality) return reject(new Error())

                const totalTagArray = totalStr.split(/#\d+\s/)

                if (totalTagArray.length > 700) return reject(new Error())
            }

            else totalStr =  totalStr.replace(regStr, newTag)

            const updateStr = 'update tags set ? where openid = ?'

            db.query(updateStr, [{ tags: totalStr }, openid], (error, updateResult) => {
                if (error) return reject(error)
                if (updateResult.affectedRows !== 1) return reject(new Error('data error...'))

                resolve()
            })
        })
    })

    if (updateTotal instanceof Error) return res.cc(updateTotal)

    res.cc('update tags success...', 0)
}

export { getNoteByTag, getList, renameTags, deleteTagRecord }