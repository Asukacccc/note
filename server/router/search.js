import { searchNote } from '../router-handler/search.js'
import express from 'express'

const router = express.Router()

router.get('/note', searchNote)

export default router
