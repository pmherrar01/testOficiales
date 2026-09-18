import { Router } from 'express'
import { pool } from '../db/pool.js'

export const statsRouter = Router()

statsRouter.get('/', async (req, res, next) => {
  try {
    const [[{ totalQuestions }]] = await pool.query('SELECT COUNT(*) AS totalQuestions FROM questions')
    const [[{ failedCount }]] = await pool.query('SELECT COUNT(*) AS failedCount FROM failed_questions')
    res.json({ totalQuestions, failedCount })
  } catch (err) {
    next(err)
  }
})
