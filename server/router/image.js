import express from 'express'
import { sendPicture } from '../router-handler/image.js'

const router = express.Router()

router.get('/:type/:name', sendPicture)

export default router