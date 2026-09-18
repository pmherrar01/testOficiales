import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'
import { signToken } from '../middleware/auth.js'

export const authRouter = Router()

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/

function validateCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'El usuario debe tener entre 3 y 30 caracteres (letras, números, "_", "." o "-").'
  }
  if (typeof password !== 'string' || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  return null
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim()
    const password = req.body.password || ''
    const validationError = validateCredentials(username, password)
    if (validationError) return res.status(400).json({ error: validationError })

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [
      username,
      passwordHash,
    ])
    const user = { id: result.insertId, username }
    res.status(201).json({ token: signToken(user), user })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim()
    const password = req.body.password || ''

    const [rows] = await pool.query('SELECT id, username, password_hash FROM users WHERE username = ?', [username])
    const row = rows[0]
    if (!row) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })

    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })

    const user = { id: row.id, username: row.username }
    res.json({ token: signToken(user), user })
  } catch (err) {
    next(err)
  }
})
