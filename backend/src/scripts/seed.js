import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from '../db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_FILE = path.resolve(__dirname, '../../../database/seed/questions.json')

const VALID_DIFFICULTIES = new Set(['facil', 'media', 'dificil'])

function normalize(q, index) {
  const questionText = q.question_text ?? q.question
  const optionA = q.option_a ?? q.optionA
  const optionB = q.option_b ?? q.optionB
  const optionC = q.option_c ?? q.optionC ?? null
  const optionD = q.option_d ?? q.optionD ?? null
  const correctOptionRaw = q.correct_option ?? q.correctOption

  if (!questionText || !optionA || !optionB || !correctOptionRaw) {
    throw new Error(`Pregunta #${index + 1} incompleta (falta question_text/option_a/option_b/correct_option): ${JSON.stringify(q).slice(0, 120)}`)
  }

  const correctOption = String(correctOptionRaw).trim().toUpperCase()
  const optionsByLetter = { A: optionA, B: optionB, C: optionC, D: optionD }
  if (!optionsByLetter[correctOption] || String(optionsByLetter[correctOption]).trim() === '') {
    throw new Error(`Pregunta #${index + 1}: correct_option "${correctOptionRaw}" no corresponde a una opción con texto.`)
  }

  const difficultyRaw = (q.difficulty || 'media').toLowerCase()
  const difficulty = VALID_DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : 'media'

  return {
    questionText,
    optionA,
    optionB,
    optionC: optionC && String(optionC).trim() !== '' ? optionC : null,
    optionD: optionD && String(optionD).trim() !== '' ? optionD : null,
    correctOption,
    reference: q.reference || '',
    category: q.category || '',
    difficulty,
    source: q.source || 'manual',
    sourcePage: q.source_page ?? q.sourcePage ?? null,
  }
}

async function main() {
  const raw = readFileSync(SEED_FILE, 'utf-8')
  const rawQuestions = JSON.parse(raw)

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error(`No se encontraron preguntas en ${SEED_FILE}`)
  }

  const questions = rawQuestions.map(normalize)

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
          q.questionText,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correctOption,
          q.reference,
          q.category,
          q.difficulty,
          q.source,
          q.sourcePage,
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
  console.error('Error al sembrar la base de datos:', err.message)
  process.exit(1)
})
