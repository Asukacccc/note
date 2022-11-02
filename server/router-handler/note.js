import db from '../database/index.js'
import { notePath, noteImagePath } from '../config/index.js'
import fs from 'fs'
import { sliceExtname } from '../utils/sliceExtname.js'
import path from 'path'

function deleteNoteContent(linkDate, isTextNote, update = true) {
    try {
        if (!update) {
            fs.unlink(path.join(notePath, linkDate + '.txt'), err => {
                if (err) return console.log(err)
            })
        }

        const temp = new Date(linkDate.slice(0, 13) - 0)
        const dirPath = path.join(noteImagePath, temp.getFullYear() + '', temp.getMonth() + 1 + '', temp.getDate() + '')
        const isExist = fs.existsSync(dirPath)

        if (!isTextNote) return
        if (!isExist) return

        fs.readdir(dirPath, (err_2, list) => {
            if (err_2) return console.log(err_2)

            for (let i of list) {
                if (i.indexOf(linkDate) !== -1) {
                    fs.unlink(path.join(dirPath, i), err => { if (err) console.log(err) })
                }
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function deleteTags(tagsArray, openid) {
    return new Promise((resolve, reject) => {
        if (tagsArray.length === 0) return resolve()
        if (tagsArray.length === 1 && tagsArray[0] === '') return resolve()

        const queryStr = 'select tags from tags where openid = ?'
        let tagsStr = ''

        db.query(queryStr, openid, (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length !== 1) return reject(new Error('data error...'))

            tagsStr = queryResult[0].tags

            for (const i of tagsArray) {
                const start = tagsStr.indexOf(' ' + i + '#')
                let number = tagsStr.slice(start + i.length + 2).split(' ')[0]
                const end = start + 2 + i.length + number.length

                number--

                if (!number) {
                    tagsStr = tagsStr.slice(0, start) + tagsStr.slice(end)
                } else {
                    tagsStr = tagsStr.slice(0, start + i.length + 2) + number + tagsStr.slice(end)
                }
            }

            const updateStr = 'update tags set ? where openid = ?'

            db.query(updateStr, [{ tags: tagsStr }, openid], (error, updateResult) => {
                if (error) return reject(error)
                if (updateResult.affectedRows !== 1) return reject(new Error('data error...'))

                resolve()
            })
        })

    })
}

function setTags(tags, openid) {
    return new Promise((resolve, reject) => {
        let newTagsArray = tags.split(/\s+/)
        const queryStr = 'select tags from tags where openid = ?'
        let tagsStr = ''
        let databaseStr = ''
        let databaseCondition

        if (tags === '') return resolve()

        db.query(queryStr, openid, (err, queryResult) => {
            if (err) return reject(err)
            if (queryResult.length > 1) return reject(new Error('tags data error...'))

            if (queryResult.length === 0) {
                newTagsArray = newTagsArray.map(v => ' ' + v + '#1')
                tagsStr = newTagsArray.join('')
                databaseStr = 'insert into tags set ?'
                databaseCondition = { openid, tags: tagsStr }
            } else {
                tagsStr = queryResult[0].tags

                if (tagsStr.split(' ').length >= 700) return reject(new Error('tags over 700...'))

                let tempStart = 0, tempEnd = 0, oldNum = 0

                for (let i of newTagsArray) {
                    if ((tempStart = tagsStr.indexOf(' ' + i + '#')) !== -1) {
                        oldNum = tagsStr.slice(tempStart + 2 + i.length).split(' ')[0]

                        if (oldNum - 0 > 700) return reject(new Error(`quantity over 700...${ i }`))

                        tempEnd = tempStart + 2 + i.length + oldNum.length

                        tagsStr = tagsStr.slice(0, tempStart + 2 + i.length) + (oldNum - 0 + 1) + tagsStr.slice(tempEnd)
                    } else {
                        tagsStr += ' ' + i + '#1'
                    }
                }

                databaseStr = 'update tags set ? where openid = ?'
                databaseCondition = [{ tags: tagsStr }, openid]
            }

            db.query(databaseStr, databaseCondition, (error, result) => {
                if (error) return reject(error)
                if (result.affectedRows !== 1) return reject(new Error('update or insert error...'))

                resolve()
            })
        })
    })
}

async function setNote(req, res) {
    const { date, tag, content, brief, title } = req.body
    const insertStr = 'insert into note set ?'
    const textLink = Date.now() + '' + Math.floor(Math.random() * 10000)
    const filePath = notePath + '/' + textLink + '.txt'
    const tagsCheckResult = await setTags(tag, req.auth.openid).catch(error => error)

    if (tagsCheckResult instanceof Error) {
        if (tagsCheckResult.message.indexOf('quantity over 700...') !== -1 || tagsCheckResult.message === 'tags over 700...') {
            return res.cc(tagsCheckResult.message, 0)
        }
        else return res.cc(tagsCheckResult)
    }

    fs.writeFile(filePath, content, err => {
        if (err) return res.cc('file input fail...')

        db.query(insertStr, {
            tag, brief, openid: req.auth.openid, updateTime: date + '', textLink, title
        }, (err, insertResult) => {
            if (err) return res.cc(err)
            if (insertResult.affectedRows !== 1) return res.cc('insert into fail...')

            res.cc('insert into success...', 0)
        })
    })
}

function deleteNote(req, res) {
    const linkDate = req.body.link
    const isTextNote = req.body.isTextNote - 0
    const queryStr = 'select tag, id from note where openid = ? and textLink = ?'

    db.query(queryStr, [req.auth.openid, linkDate], async (error, queryResult) => {
        if (error) return res.cc(error)
        if (queryResult.length !== 1) return res.cc('query data error...')

        const removeTagArray = queryResult[0].tag.split(' ')
        const removeResult = await deleteTags(removeTagArray, req.auth.openid)

        if (removeResult instanceof Error) return res.cc(removeResult)

        const deleteStr = 'delete from note where textLink = ? and openid = ?'

        db.query(deleteStr, [linkDate, req.auth.openid], (err, deleteResult) => {
            if (err) return res.cc(err)
            if (deleteResult.affectedRows !== 1) return res.cc('delete fail...')

            const deleteShare = 'delete from publish where noteId = ? and openid = ?'

            db.query(deleteShare, [queryResult[0].id, req.auth.openid], (shareDeleteError, shareDeleteResult) => {
                if (shareDeleteError) return res.cc(shareDeleteError)
                if (shareDeleteResult.affectedRows > 1) return res.cc('delete share record by delete note fail')

                res.cc('delete success', 0)
            })
        })

    })

    deleteNoteContent(linkDate, isTextNote, false)
}

async function updateNote(req, res) {
    function updateDataBase(object, linkTime) {
        return new Promise((resolve, reject) => {
            const updateStr = 'update note set ? where textLink = ? and openid = ?'

            db.query(updateStr, [object, linkTime, req.auth.openid], (err, updateResult) => {
                if (err) return reject(err)
                if (updateResult.affectedRows !== 1) return reject(new Error('update fail...'))
            })
            resolve()
        })
    }

    function updateTextContent(content, linkTime, isTextNote) {
        deleteNoteContent(linkTime, isTextNote)
        return new Promise((resolve, reject) => {
            fs.writeFile(`${notePath}/${linkTime}.txt`, content, { flag: 'w+' }, err => {
                if (err) return reject(err)

                resolve()
            })
        })
    }

    let updateType = req.body.type - 0
    const updateContent = JSON.parse(req.body.content)
    const updateTime = req.body.updateTime
    const updateObj = {}
    const link = req.body.link
    const isTextNote = req.body.isTextNote - 0

    if (updateType >= 4) {
        const textUpdateResult = await updateTextContent(updateContent[3], link, isTextNote).catch(error => error)

        if (textUpdateResult instanceof Error) return res.cc(textUpdateResult)

        updateObj.brief = updateContent[2]
        updateType = updateType - 4
    }

    if (updateType % 2 !== 0) {
        updateObj.tag = updateContent[0]

        const tagsResult = await new Promise((resolve, reject) => {
            const queryStr = 'select tag from note where openid = ? and textLink = ?'

            db.query(queryStr, [req.auth.openid, link], (err, queryResult) => {
                if (err) return reject(err)
                if (queryResult.length !== 1) return reject(new Error('data error...'))

                resolve(queryResult[0].tag)
            })
        }).catch(error => error)

        if (tagsResult instanceof Error) return res.cc(tagsResult)

        const oldTagsArray = new Set(tagsResult.split(' '))
        const newTagsArray = new Set(updateContent[0].split(' '))
        const removerArray = [...oldTagsArray].filter(v => !newTagsArray.has(v))
        const addArray = [...newTagsArray].filter(v => !oldTagsArray.has(v))
        const removeResult = await deleteTags(removerArray, req.auth.openid).catch(error => error)

        if (removeResult instanceof Error) return res.cc(removeResult)

        const addResult = await setTags(addArray.toString().replace(/,/g, ' '), req.auth.openid).catch(error => error)

        if (addResult instanceof Error) return res.cc(addResult)

        updateType--
    }

    if (updateType === 2) {
        updateObj.title = updateContent[1]
    }

    updateObj.updateTime = updateTime

    const dataBaseResult = await updateDataBase(updateObj, link).catch(error => error)

    if (dataBaseResult instanceof Error) return res.cc(dataBaseResult)

    res.cc('update success...', 0)
}

function uploadNotePicture(req, res) {
    let date = req.body.date - 0
    const total = new Date(date)
    const year = total.getFullYear()
    const month = total.getMonth() + 1
    const day = total.getDate()
    const userImagePath = `${noteImagePath}/${year}/${month}/${day}`

    date = req.body.date + '' + Math.floor(Math.random() * 10000)

    if (!fs.existsSync(userImagePath)) fs.mkdirSync(userImagePath, { recursive: true })

    fs.rename(req.file.path, `${userImagePath}/${date}_${req.body.index}${sliceExtname(req.file.originalname)}`, err => {
        if (err) return res.cc(err)

        res.cc(`${year}-${month}-${day}-${date}_${req.body.index}${sliceExtname(req.file.originalname)}`, 0)
    })
}

function getNote(req, res) {
    const queryStr =
        'select id, title, tag, brief, imageCount, updateTime, textLink, shareDate from note where openid = ? order by updateTime desc limit ?, ?'
    const { start, length } = req.query

    db.query(queryStr, [req.auth.openid, start - 0, length - 0], (err, queryResult) => {
        if (err) return res.cc(err)

        res.cc(queryResult, 0)
    })
}

function getLatestNote(req, res) {
    const queryStr =
        'select id, title, tag, brief, imageCount, updateTime, textLink, shareDate from note where openid = ? order by id desc limit 0, 1'

    db.query(queryStr, req.auth.openid, (err, queryResult) => {
        if (err) return res.cc(err)
        if (queryResult.length !== 1) return res.cc('query fail...')

        res.cc(queryResult[0], 0)
    })
}

function getPartInfo(req, res) {
    const queryStr = 'select tag, title, textLink, shareDate, updateTime from note where id = ? and openid = ?'
    const openid = req.auth.openid
    const id = req.query.id

    db.query(queryStr, [id, openid], (err, queryResult) => {
        if (err) return res.cc(err)
        if (queryResult.length !== 1) return res.cc('data error...')

        res.cc(queryResult[0], 0)
    })
}

function getNoteContent(req, res) {
    const textLink = req.query.textLink

    fs.readFile(`${notePath}/${textLink}.txt`, (err, data) => {
        if (err) return res.cc(err)

        res.cc(data.toString(), 0)
    })
}

export { setNote, getLatestNote, getNote, uploadNotePicture, getNoteContent, updateNote, deleteNote, deleteTags, getPartInfo }