import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { statsRouter } from './routes/stats.js'
import { examsRouter } from './routes/exams.js'
import { authRouter } from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'
import { pool } from './db/pool.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'error', error: err.message })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/stats', requireAuth, statsRouter)
app.use('/api/exams', requireAuth, examsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API de oficiales de mesa escuchando en http://localhost:${PORT}`)
})
