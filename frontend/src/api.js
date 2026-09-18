const API_BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Error de red')
  }
  return data
}

export const getStats = () => request('/stats')
export const createExam = (body) => request('/exams', { method: 'POST', body: JSON.stringify(body) })
export const getExam = (id) => request(`/exams/${id}`)
export const submitExam = (id, answers) =>
  request(`/exams/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) })
