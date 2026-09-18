import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Exam from './pages/Exam.jsx'
import Results from './pages/Results.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { useAuth } from './AuthContext.jsx'

function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="app-header">
      <h1>Examen Oficiales de Mesa · Baloncesto</h1>
      {user && (
        <div className="user-bar">
          <span>{user.username}</span>
          <button className="link-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute>
                <Exam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
