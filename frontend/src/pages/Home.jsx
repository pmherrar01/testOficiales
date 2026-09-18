import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, createExam } from '../api.js'

const COUNT_OPTIONS = [5, 15, 25]

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [numQuestions, setNumQuestions] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [])

  async function startExam(mode) {
    setLoading(true)
    setError(null)
    try {
      const body = mode === 'fallos' ? { mode: 'fallos' } : { mode: 'normal', numQuestions }
      const exam = await createExam(body)
      navigate(`/exam/${exam.examId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>¿Cuántas preguntas quieres en el test?</h2>
      <div className="count-options">
        {COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`count-btn ${numQuestions === n ? 'selected' : ''}`}
            onClick={() => setNumQuestions(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <button className="primary-btn" disabled={loading} onClick={() => startExam('normal')}>
        Comenzar examen
      </button>

      {stats && (
        <p className="stats-line">
          Banco de preguntas: {stats.totalQuestions} · Preguntas falladas pendientes: {stats.failedCount}
        </p>
      )}

      <hr />

      <h2>Repaso de fallos</h2>
      <p>
        {stats?.failedCount
          ? `Tienes ${stats.failedCount} pregunta(s) pendientes de repasar. Se eliminan de esta lista en cuanto las respondes bien.`
          : 'No tienes preguntas falladas pendientes.'}
      </p>
      <button
        className="secondary-btn"
        disabled={loading || !stats?.failedCount}
        onClick={() => startExam('fallos')}
      >
        Repasar fallos {stats?.failedCount ? `(${stats.failedCount})` : ''}
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
