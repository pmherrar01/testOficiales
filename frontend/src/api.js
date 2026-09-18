import { getToken, clearSession } from './auth.js'

const API_BASE = '/api'

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    clearSession()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error de red')
  }
  return data
}

export const register = (username, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const getStats = () => request('/stats')
export const createExam = (body) => request('/exams', { method: 'POST', body: JSON.stringify(body) })
export const getExam = (id) => request(`/exams/${id}`)
export const submitExam = (id, answers) =>
  request(`/exams/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) })
