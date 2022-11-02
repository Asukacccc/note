import express from 'express'
import { setNote, getLatestNote, getNote, uploadNotePicture, getNoteContent, updateNote, deleteNote, getPartInfo } from '../router-handler/note.js'
import { uploadImage } from '../utils/uploadImage.js'

const router = express.Router()

router.post('/set', setNote)
router.get('/latest', getLatestNote)
router.get('/get', getNote)
router.post('/upload', uploadImage, uploadNotePicture)
router.get('/content', getNoteContent)
router.post('/update', updateNote)
router.post('/delete', deleteNote)
router.get('/part', getPartInfo)

export default router