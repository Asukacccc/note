import path from "path"

const basePath = path.join(path.resolve(), '../DataBaseSource')

export const jwtKey = {
    secret: 'Alice is in the wonderland',
    expiresIn: '24h'
}

export const weixin = {
    appSecret: '3151122cd69e7d1bc0f0e5f555d094f9',
    appId: 'wx7a09107830d166a9'
}

export const avatarPath = path.join(basePath, './image/avatar')
export const noteImagePath = path.join(basePath, './image/note')
export const tempPath = path.join(basePath, './image/temp')
export const notePath = path.join(basePath, './note')