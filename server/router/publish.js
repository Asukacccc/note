import express from 'express'
import { setPublish, updatePublish, deletePublish, getInfoOnMini, getShareList } from '../router-handler/publish.js'

const router = express.Router()

router.post('/set', setPublish)
router.post('/update', updatePublish)
router.post('/delete', deletePublish)
router.get('/mini', getInfoOnMini)
router.get('/list', getShareList)


export default router