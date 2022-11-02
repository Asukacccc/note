import express from 'express'
import { checkNoteInfo, getContent, checkVerification, linkJump } from '../router-handler/mobile.js'

const router = express.Router()

router.get('/share/:noteId', checkNoteInfo)
router.get('/content/:noteId', getContent)
router.post('/check', checkVerification)
router.get('/link/:noteId/:firstNoteId', linkJump)

export default router