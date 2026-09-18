import { createContext, useContext, useState, useCallback } from 'react'
import { getToken, getStoredUser, setSession, clearSession } from './auth.js'
import * as api from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null))

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password)
    setSession(data.token, data.user)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (username, password) => {
    const data = await api.register(username, password)
    setSession(data.token, data.user)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
