import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from '../db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_FILE = path.resolve(__dirname, '../../../database/seed/questions.json')

async function main() {
  const raw = readFileSync(SEED_FILE, 'utf-8')
  const questions = JSON.parse(raw)

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`No se encontraron preguntas en ${SEED_FILE}`)
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM exams')
    await conn.query('DELETE FROM failed_questions')
    await conn.query('DELETE FROM questions')

    for (const q of questions) {
      await conn.query(
        `INSERT INTO questions
          (question_text, option_a, option_b, option_c, option_d, correct_option, reference, category, difficulty, source, source_page)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.question,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correctOption,
          q.reference || '',
          q.category || '',
          q.difficulty || 'media',
          q.source || 'oficiales',
          q.sourcePage || null,
        ]
      )
    }

    await conn.commit()
    console.log(`Sembradas ${questions.length} preguntas en la base de datos.`)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Error al sembrar la base de datos:', err)
  process.exit(1)
})
