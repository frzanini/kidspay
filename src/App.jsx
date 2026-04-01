import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import ChildMode from './pages/ChildMode'
import ParentMode from './pages/ParentMode'
import { getDB } from './lib/db'

function AppEntryGate() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let mounted = true

    async function checkEntryState() {
      const db = await getDB()
      const [profile, tasks] = await Promise.all([
        db.get('profile', 'current'),
        db.getAll('tasks'),
      ])
      if (!mounted) return
      if (!profile) {
        setStatus('needs-onboarding')
        return
      }

      const hasActiveTasks = tasks.some(task => task.active)
      setStatus(hasActiveTasks ? 'ready-for-child' : 'needs-parent-setup')
    }

    checkEntryState()

    return () => {
      mounted = false
    }
  }, [])

  if (status === 'loading') return null

  if (status === 'needs-onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (status === 'needs-parent-setup') {
    return <Navigate to="/parents" replace />
  }

  return <ChildMode />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<AppEntryGate />} />
        <Route path="/parents" element={<ParentMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
