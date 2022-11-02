import express from 'express'
import { getList, getNoteByTag, renameTags, deleteTagRecord } from '../router-handler/tags.js'

const router = express.Router()

router.get('/get', getList)
router.get('/detail', getNoteByTag)
router.post('/rename', renameTags)
router.post('/delete', deleteTagRecord)


export default router