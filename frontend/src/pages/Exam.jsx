import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getExam, submitExam } from '../api.js'

export default function Exam() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getExam(examId)
      .then((data) => {
        if (data.finished) {
          navigate(`/exam/${examId}/results`, { replace: true })
          return
        }
        setExam(data)
      })
      .catch((e) => setError(e.message))
  }, [examId, navigate])

  function selectOption(examQuestionId, letter) {
    setAnswers((prev) => ({ ...prev, [examQuestionId]: letter }))
  }

  async function handleSubmit() {
    if (!exam) return
    const unanswered = exam.questions.filter((q) => !answers[q.examQuestionId])
    if (unanswered.length > 0) {
      const ok = window.confirm(
        `Tienes ${unanswered.length} pregunta(s) sin responder. ¿Corregir de todas formas?`
      )
      if (!ok) return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = Object.entries(answers).map(([examQuestionId, selected]) => ({
        examQuestionId: Number(examQuestionId),
        selected,
      }))
      await submitExam(examId, payload)
      navigate(`/exam/${examId}/results`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <p className="error-text">{error}</p>
  if (!exam) return <p>Cargando examen...</p>

  const answeredCount = Object.keys(answers).length

  return (
    <div className="card exam-card">
      <div className="exam-progress">
        Respondidas {answeredCount} / {exam.questions.length}
        {exam.mode === 'fallos' && <span className="badge">Test de fallos</span>}
      </div>

      {exam.questions.map((q, idx) => (
        <div key={q.examQuestionId} className="question-block">
          <p className="question-text">
            <span className="question-number">{idx + 1}.</span> {q.question}
          </p>
          <div className={`options-list ${q.options.length === 2 ? 'two-options' : ''}`}>
            {q.options.map((opt) => (
              <label
                key={opt.letter}
                className={`option-label ${answers[q.examQuestionId] === opt.letter ? 'checked' : ''}`}
              >
                <input
                  type="radio"
                  name={`q-${q.examQuestionId}`}
                  value={opt.letter}
                  checked={answers[q.examQuestionId] === opt.letter}
                  onChange={() => selectOption(q.examQuestionId, opt.letter)}
                />
                <span className="option-letter">{opt.letter}</span>
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button className="primary-btn" disabled={submitting} onClick={handleSubmit}>
        Corregir examen
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
