import express from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { listRows, upsertRows } from '../services/rows.js'

const router = express.Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || undefined
    const data = await listRows(req.user.id, limit)
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : [req.body]
    const result = await upsertRows(req.user.id, rows)
    res.json({ result })
  } catch (err) {
    next(err)
  }
})

export default router
