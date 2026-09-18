import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getExam } from '../api.js'

const PASS_THRESHOLD = 80

export default function Results() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getExam(examId).then(setExam).catch((e) => setError(e.message))
  }, [examId])

  if (error) return <p className="error-text">{error}</p>
  if (!exam) return <p>Cargando resultados...</p>

  const passed = exam.percentage >= PASS_THRESHOLD
  const failedNow = exam.questions.filter((q) => !q.isCorrect).length

  return (
    <div className="card">
      <div className={`score-banner ${passed ? 'pass' : 'fail'}`}>
        <h2>
          {exam.correctCount} / {exam.numQuestions} correctas ({exam.percentage}%)
        </h2>
        <p>
          {passed ? 'APTO' : 'NO APTO'} (umbral {PASS_THRESHOLD}%)
        </p>
      </div>

      {failedNow > 0 && (
        <p className="stats-line">
          {failedNow} pregunta(s) de este examen se han añadido (o se mantienen) en tu repaso de fallos.
        </p>
      )}

      {exam.questions.map((q, idx) => (
        <div key={q.examQuestionId} className={`question-block result ${q.isCorrect ? 'correct' : 'incorrect'}`}>
          <p className="question-text">
            <span className="question-number">{idx + 1}.</span> {q.question}
          </p>
          <div className="options-list">
            {q.options.map((opt) => {
              const isSelected = q.selected === opt.letter
              const classNames = [
                'option-label',
                'static',
                opt.isCorrect ? 'is-correct' : '',
                isSelected && !opt.isCorrect ? 'is-wrong-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div key={opt.letter} className={classNames}>
                  <span className="option-letter">{opt.letter}</span>
                  <span>{opt.text}</span>
                  {isSelected && <span className="tag">Tu respuesta</span>}
                  {opt.isCorrect && <span className="tag tag-correct">Correcta</span>}
                </div>
              )
            })}
          </div>
          {q.reference && <p className="reference">Referencia: {q.reference}</p>}
          {q.category && <p className="category">Tema: {q.category}</p>}
        </div>
      ))}

      <div className="results-actions">
        <Link className="primary-btn" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
