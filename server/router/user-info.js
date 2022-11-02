import express from 'express'
import { getUserOpenId, updateUserInfo, getUserInfo } from '../router-handler/user-info.js'
import { uploadImage } from '../utils/uploadImage.js'

const router = express.Router()

router.post('/openid', getUserOpenId)
router.post('/update', uploadImage, updateUserInfo)
router.get('/get', getUserInfo)

export default router