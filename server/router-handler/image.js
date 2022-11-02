import { avatarPath, noteImagePath } from '../config/index.js'

function sendPicture(req, res) {
    const type = req.params.type
    const name = req.params.name
    const filePath = type === 'avatar' ? avatarPath : noteImagePath

    res.sendFile(`${filePath}/${type === 'avatar' ? name : (name.replaceAll('-', '/'))}`)
}

export { sendPicture }