import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Exam from './pages/Exam.jsx'
import Results from './pages/Results.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Examen Oficiales de Mesa · Baloncesto</h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examId" element={<Exam />} />
          <Route path="/exam/:examId/results" element={<Results />} />
        </Routes>
      </main>
    </div>
  )
}
