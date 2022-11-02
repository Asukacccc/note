import multer from "multer"
import { tempPath } from '../config/index.js'
import path from "path"
import fs from 'fs'

function uploadImage(req, res, next) {
    const storage = {
        storage: multer.diskStorage({
            destination(req, file, callback) {
                if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true })
                callback(null, tempPath)
            },
            filename(req, file, callback) {
                const fileName = new Date().getTime() + path.extname(file.originalname)
                callback(null, fileName)
            }
        })
    }
    const upload = multer(storage).single('image')
    upload(req, res, err => {
        if (err) return res.cc(err)

        next()
    })
}

export { uploadImage }