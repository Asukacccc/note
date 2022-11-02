import db from '../database/index.js'
import { notePath } from '../config/index.js'
import fs from 'fs'
import lineStyle from '../utils/item-style.js'

function checkIsNeedVerification(noteId) {
    return new Promise((resolve, reject) => {
        const queryStr = 'select verification from publish where noteId = ?'

        db.query(queryStr, noteId, (err, queryResult) => {
            if (err) reject(err)
            if (queryResult.length !== 1) reject(new Error('the verification check id not unique'))

            resolve(!!queryResult[0].verification)
        })
    })
}

function checkAccess(noteId) {
    return new Promise((resolve, reject) => {
        const queryStr = 'select access from publish where noteId = ?'

        db.query(queryStr, noteId, (err, queryResult) => {
            if (err) reject(err)
            if (queryResult.length !== 1) reject(new Error('the access check result is not unique'))

            resolve(queryResult[0].access === '1')
        })
    })
}

function checkVerification(req, res) {
    const { verification, noteId } = req.body
    const queryStr = 'select verification, noteId from publish where noteId = ?'

    db.query(queryStr, noteId, (err, queryResult) => {
        if (err) return res.cc(false)
        if (queryResult.length !== 1) return res.cc(false)

        const verificationValid = verification === queryResult[0].verification

        if (verificationValid) {
            req.session.date = Date.now()
            !req.session.array && (req.session.array = [])
            req.session.array.push(queryResult[0].noteId)
            req.session.firstNoteId = queryResult[0].noteId

            res.cc(queryResult[0].noteId, 0)
        } else {
            res.cc('verification error')
        }
    })
}

async function checkNoteInfo(req, res) {
    const noteId = req.params.noteId
    const queryStr = 'select * from publish where noteId = ?'

    if (isNaN(noteId - 0)) return res.render('404.art', { isTimeout: false })

    db.query(queryStr, [noteId], (err, queryResult) => {
        if (err) return res.render('404.art', { isTimeout: false })
        if (queryResult.length !== 1) return res.render('404.art', { isTimeout: false })

        const currentTime = Date.now()

        // 86400000 one day

        if (currentTime > queryResult[0].abortDate + 86400000) {
            return res.render('404.art', { isTimeout: true })
        }

        if (queryResult[0].verification === '') {
            return getContent(req, res)
        } else {
            return res.render('verification.art')
        }
    })
}

async function getContent(req, res) {
    const { noteId } = req.params
    let { firstNoteId } = req.query
    const noteInfoQuery = 'select textLink, openid, updateTime, title from note where id = ?'

    firstNoteId = firstNoteId || noteId

    const isNeed = await checkIsNeedVerification(firstNoteId)

    if (isNeed) {
        if (!req.session.date) {
            return res.render('verification.art', { noteId: firstNoteId, isBackToFirst: req.temp })
        } else {
            if (req.session.array.indexOf(noteId) === -1) {
                return res.render('verification.art', { noteId: firstNoteId })
            }

            if (req.session.firstNoteId !== firstNoteId) {
                return res.render('verification.art', { noteId: firstNoteId })
            }
        }
    }

    db.query(noteInfoQuery, noteId, async (err, noteQueryResult) => {
        if (err) return res.cc(false)
        if (noteQueryResult.length !== 1) return res.cc(false)

        const filePath = `${notePath}/${noteQueryResult[0].textLink}.txt`
        const isAccess = await checkAccess(noteId)

        fs.readFile(filePath, (err, textData) => {
            if (err) return res.cc(false)

            const queryUserInfo = `select signature, name, avatar from user where openid = '${noteQueryResult[0].openid}'`
            db.query(queryUserInfo, (userInfoError, userInfoResult) => {
                if (userInfoError || userInfoResult.length !== 1) return res.cc(false)

                const data = {
                    content: noteQueryResult[0].title ? JSON.parse(textData.toString()) : textData.toString(),
                    name: userInfoResult[0].name,
                    avatar: userInfoResult[0].avatar,
                    signature: userInfoResult[0].signature,
                    updateTime: noteQueryResult[0].updateTime,
                    isTextNote: !noteQueryResult[0].title,
                    style: noteQueryResult[0].title ? lineStyle(textData.toString()) : '',
                    title: noteQueryResult[0].title,
                    firstNoteId: firstNoteId || noteId,
                    isAccess
                }

                res.render('content.art', data)
            })
        })
    })
}

function linkJump(req, res) {
    const { noteId, firstNoteId } = req.params

    if (req.session.date) {
        req.session.data = Date.now()
        req.session.array.push(noteId)
    }

    req.params.noteId = noteId
    req.query.firstNoteId = firstNoteId
    req.temp = true

    getContent(req, res)
}

export { checkNoteInfo, getContent, checkVerification, linkJump }