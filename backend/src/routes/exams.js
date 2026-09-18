import { Router } from 'express'
import { pool } from '../db/pool.js'
import { shuffleOptionOrder, buildDisplayOptions, displayLetterToOriginal } from '../lib/options.js'

export const examsRouter = Router()

const ALLOWED_COUNTS = [5, 15, 25]

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function fetchQuestionsByIds(ids) {
  if (ids.length === 0) return []
  const [rows] = await pool.query('SELECT * FROM questions WHERE id IN (?)', [ids])
  const byId = new Map(rows.map((r) => [r.id, r]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}

async function getExamDetail(examId) {
  const [[exam]] = await pool.query('SELECT * FROM exams WHERE id = ?', [examId])
  if (!exam) return null

  const [eqRows] = await pool.query(
    'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY position',
    [examId]
  )
  const questionRows = await fetchQuestionsByIds(eqRows.map((r) => r.question_id))
  const questionById = new Map(questionRows.map((q) => [q.id, q]))

  if (!exam.finished_at) {
    const questions = eqRows.map((eq) => {
      const q = questionById.get(eq.question_id)
      return {
        examQuestionId: eq.id,
        position: eq.position,
        question: q.question_text,
        category: q.category,
        difficulty: q.difficulty,
        options: buildDisplayOptions(q, eq.option_order),
      }
    })
    return { examId: exam.id, mode: exam.mode, finished: false, numQuestions: questions.length, questions }
  }

  const questions = eqRows.map((eq) => {
    const q = questionById.get(eq.question_id)
    const options = buildDisplayOptions(q, eq.option_order).map((opt) => ({
      ...opt,
      isCorrect: displayLetterToOriginal(eq.option_order, opt.letter) === q.correct_option,
    }))
    return {
      examQuestionId: eq.id,
      position: eq.position,
      question: q.question_text,
      category: q.category,
      difficulty: q.difficulty,
      reference: q.reference,
      options,
      selected: eq.selected_option
        ? options.find((o) => displayLetterToOriginal(eq.option_order, o.letter) === eq.selected_option)?.letter ?? null
        : null,
      isCorrect: !!eq.is_correct,
    }
  })

  const correctCount = questions.filter((q) => q.isCorrect).length
  return {
    examId: exam.id,
    mode: exam.mode,
    finished: true,
    numQuestions: questions.length,
    score: exam.score,
    correctCount,
    percentage: Math.round((correctCount / questions.length) * 100),
    questions,
  }
}

// POST /api/exams  { numQuestions, mode }
examsRouter.post('/', async (req, res, next) => {
  try {
    const mode = req.body.mode === 'fallos' ? 'fallos' : 'normal'
    let questionRows

    if (mode === 'fallos') {
      const [failedRows] = await pool.query(
        'SELECT q.* FROM failed_questions f JOIN questions q ON q.id = f.question_id'
      )
      if (failedRows.length === 0) {
        return res.status(400).json({ error: 'No hay preguntas falladas para repasar.' })
      }
      questionRows = shuffleArray(failedRows)
    } else {
      const numQuestions = Number(req.body.numQuestions)
      if (!ALLOWED_COUNTS.includes(numQuestions)) {
        return res.status(400).json({ error: 'numQuestions debe ser 5, 15 o 25.' })
      }
      const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM questions')
      if (countRows[0].total < numQuestions) {
        return res.status(400).json({ error: 'No hay suficientes preguntas en el banco.' })
      }
      const [rows] = await pool.query('SELECT * FROM questions ORDER BY RAND() LIMIT ?', [numQuestions])
      questionRows = rows
    }

    const [examResult] = await pool.query(
      'INSERT INTO exams (mode, num_questions) VALUES (?, ?)',
      [mode, questionRows.length]
    )
    const examId = examResult.insertId

    let position = 0
    for (const q of questionRows) {
      const optionOrder = shuffleOptionOrder()
      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, position, option_order) VALUES (?, ?, ?, ?)',
        [examId, q.id, position, optionOrder]
      )
      position += 1
    }

    const detail = await getExamDetail(examId)
    res.status(201).json(detail)
  } catch (err) {
    next(err)
  }
})

// GET /api/exams/:id
examsRouter.get('/:id', async (req, res, next) => {
  try {
    const detail = await getExamDetail(Number(req.params.id))
    if (!detail) return res.status(404).json({ error: 'Examen no encontrado.' })
    res.json(detail)
  } catch (err) {
    next(err)
  }
})

// POST /api/exams/:id/submit  { answers: [{ examQuestionId, selected }] }
examsRouter.post('/:id/submit', async (req, res, next) => {
  try {
    const examId = Number(req.params.id)
    const [[exam]] = await pool.query('SELECT * FROM exams WHERE id = ?', [examId])
    if (!exam) return res.status(404).json({ error: 'Examen no encontrado.' })

    if (exam.finished_at) {
      const detail = await getExamDetail(examId)
      return res.json(detail)
    }

    const answers = Array.isArray(req.body.answers) ? req.body.answers : []
    const answerByEqId = new Map(answers.map((a) => [Number(a.examQuestionId), a.selected || null]))

    const [eqRows] = await pool.query(
      'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY position',
      [examId]
    )
    const questionRows = await fetchQuestionsByIds(eqRows.map((r) => r.question_id))
    const questionById = new Map(questionRows.map((q) => [q.id, q]))

    for (const eq of eqRows) {
      const q = questionById.get(eq.question_id)
      const selectedDisplay = answerByEqId.get(eq.id) || null
      const selectedOriginal = selectedDisplay ? displayLetterToOriginal(eq.option_order, selectedDisplay) : null
      const isCorrect = selectedOriginal === q.correct_option

      await pool.query(
        'UPDATE exam_questions SET selected_option = ?, is_correct = ? WHERE id = ?',
        [selectedOriginal, isCorrect, eq.id]
      )

      if (isCorrect) {
        await pool.query('DELETE FROM failed_questions WHERE question_id = ?', [q.id])
      } else {
        await pool.query(
          `INSERT INTO failed_questions (question_id, fail_count) VALUES (?, 1)
           ON DUPLICATE KEY UPDATE fail_count = fail_count + 1, last_failed_at = CURRENT_TIMESTAMP`,
          [q.id]
        )
      }
    }

    const correctCount = eqRows.length
      ? (await pool.query('SELECT COUNT(*) AS c FROM exam_questions WHERE exam_id = ? AND is_correct = 1', [examId]))[0][0].c
      : 0

    await pool.query('UPDATE exams SET score = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?', [
      correctCount,
      examId,
    ])

    const detail = await getExamDetail(examId)
    res.json(detail)
  } catch (err) {
    next(err)
  }
})
