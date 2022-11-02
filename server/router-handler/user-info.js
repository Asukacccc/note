import db from '../database/index.js'
import { weixin, jwtKey } from '../config/index.js'
import fly from 'flyio'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { avatarPath } from '../config/index.js'

async function getUserOpenId(req, res) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${weixin.appId}&secret=${weixin.appSecret}&js_code=${req.body.code}&grant_type=authorization_code`
    const result = await fly.get(url)
    const openid = JSON.parse(result.data).openid

    if (!openid) {
        return res.cc('need code to require openid')
    }

    const tokenStr = jwt.sign({ openid }, jwtKey.secret, { expiresIn: jwtKey.expiresIn })
    const queryStr = 'select * from user where openid = ?'

    db.query(queryStr, openid, (err, queryResult) => {
        if (err) return res.cc(err)
        if (queryResult.length > 1) return res.cc('acquire user not unique')
        if (queryResult.length === 1) return res.cc(`Bearer ${tokenStr}`, 0)

        if(queryResult.length === 0) {
            const addUserStr = 'insert into user set ?'
            db.query(addUserStr, { openid, name: '未定义名称' }, (err, insertResult) => {
                if (err) return res.cc(err)
                if (insertResult.affectedRows !== 1) return res.cc(new Error('add user error'))

                res.cc(`Bearer ${tokenStr}`, 0)
            })
        }
    })
}

async function updateUserInfo(req, res) {
    const updateStr = 'update user set ? where openid = ?'
    const content = req.body.content || Math.floor(Math.random() * 10000) + "-" + req.file.filename

    if (req.file) {
        const unlinkResult = await new Promise((resolve, reject) => {
            const queryStr = 'select avatar from user where openid = ?'

            db.query(queryStr, req.auth.openid, (err, queryResult) => {
                if (err) return reject(err)
                if (queryResult.length !== 1) return res.cc('avatar update fail...')
                if (queryResult[0].avatar === 'default.png') resolve()
                else {
                    const oldPath = path.join(avatarPath, queryResult[0].avatar)

                    fs.unlink(oldPath, err => {
                        if (err) return res.cc(err)

                        resolve()
                    })
                }
            })
        }).catch(error => error)

        if (unlinkResult instanceof Error) return res.cc(unlinkResult)

        const renameResult = await new Promise((resolve, reject) => {
            fs.rename(req.file.path, path.join(avatarPath, content), err => {
                if (err) reject(err)

                resolve()
            })
        }).catch(err => err)

        if (renameResult instanceof Error) return res.cc(renameResult)
    }

    db.query(updateStr, [{ [req.body.type]: content }, req.auth.openid], (err, updateResult) => {
        if (err) return res.cc(err)
        if (updateResult.affectedRows !== 1) return res.cc('update fail...')

        res.cc(req.file ? content : 'update success...', 0)
    })
}

async function getUserInfo(req, res) {
    const openid = req.auth.openid
    const queryStr = `select name, avatar, signature from user where openid = "${ openid }"`

    db.query(queryStr, (err, queryResult) => {
        if (err) return res.cc(err)
        if (queryResult.length > 1) return res.cc(new Error('user not unique'))

        return res.cc(queryResult[0], 0)
    })
}

export { getUserOpenId, updateUserInfo, getUserInfo }

