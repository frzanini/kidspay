import { useState, useEffect, useSyncExternalStore } from 'react'

function subscribe(cb) {
  const mq = window.matchMedia('(orientation: landscape)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
function getSnapshot() {
  return window.matchMedia('(orientation: landscape)').matches
}
import { getDB } from '../lib/db'
import HeroSection from '../components/child/HeroSection'
import TodayCard from '../components/child/TodayCard'
import WeeklyProgressChart from '../components/child/WeeklyProgressChart'
import BottomNav from '../components/shared/BottomNav'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// 0=Seg, …, 4=Sex, 5=Sáb, 6=Dom
function getDayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7
}

function calcDayBalance(tasks, entries, dayIdx) {
  let total = 0
  for (const e of entries) {
    if (!e.checked || e.dayIndex !== dayIdx) continue
    const task = tasks.find(t => t.id === e.taskId)
    if (!task) continue
    if (task.type === 'so_penalidade') total -= (task.debit  || 0)
    else                               total += (task.credit || 0)
  }
  return total
}

// ── useChecklist ─────────────────────────────────────────────────────────────

function useChecklist(weekId, dayIndex) {
  const [entries, setEntries] = useState([])

  async function load() {
    const db  = await getDB()
    const all = await db.getAllFromIndex('checklist', 'weekId', weekId)
    setEntries(all)
  }

  useEffect(() => { load() }, [weekId])

  async function toggle(taskId) {
    const id       = `${weekId}-${taskId}-${dayIndex}`
    const existing = entries.find(e => e.id === id)
    const checked  = existing ? !existing.checked : true
    const db       = await getDB()
    await db.put('checklist', { id, weekId, taskId, dayIndex, checked })
    load()
  }

  function isChecked(taskId) {
    const e = entries.find(e => e.taskId === taskId && e.dayIndex === dayIndex)
    return e?.checked || false
  }

  return { entries, isChecked, toggle }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ChildMode() {
  const [tasks,    setTasks]    = useState([])
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState('habitos')
  const isLandscape = useSyncExternalStore(subscribe, getSnapshot)

  const today     = new Date()
  const weekId    = getISOWeekId(today)
  const dayIndex  = getDayIndex(today)
  const isWeekend = dayIndex >= 5

  useEffect(() => {
    async function load() {
      const db = await getDB()
      const [p, allTasks] = await Promise.all([
        db.get('profile', 'current'),
        db.getAll('tasks'),
      ])
      setProfile(p || {})
      setTasks(allTasks.filter(t => t.active))
      setLoading(false)
    }
    load()
  }, [])

  const { entries, isChecked, toggle } = useChecklist(weekId, dayIndex)

  // ── Cálculos ──
  const weekBalance     = [0,1,2,3,4,5,6].reduce((sum, d) => sum + calcDayBalance(tasks, entries, d), 0)
  const todayCompleted  = entries.filter(e => e.dayIndex === dayIndex && e.checked).length
  const dailyBalances   = [0,1,2,3,4,5,6].map(d => calcDayBalance(tasks, entries, d))

  const perfectInPlay = !entries.some(e => {
    if (!e.checked) return false
    const t = tasks.find(t => t.id === e.taskId)
    return t?.type === 'so_penalidade' && t?.affectsStreak
  })

  // ── Loading ──
  if (loading) {
    return (
      <div style={{
        height: '100dvh', background: '#F5F2ED',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#888', fontWeight: 700 }}>Carregando…</p>
      </div>
    )
  }

  const heroProps = {
    childName: profile?.childName,
    photo: profile?.photo,
    tasksCompleted: todayCompleted,
    tasksTotal: tasks.length,
    weekBalance,
  }

  const todayProps = {
    tasks, isChecked, onToggle: toggle,
    dayIndex, activeTab, onTabChange: setActiveTab,
    todayCompleted, isWeekend,
  }

  if (isLandscape) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'row',
        background: '#F5F2ED', overflow: 'hidden',
      }}>
        {/* Esquerda: HeroSection em modo paisagem */}
        <div style={{ width: '38%', flexShrink: 0, position: 'relative' }}>
          <HeroSection {...heroProps} landscape />
        </div>

        {/* Direita: lista + gráfico */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 68,
        }}>
          <TodayCard {...todayProps} landscape />
          {!isWeekend && (
            <WeeklyProgressChart
              dailyBalances={dailyBalances}
              weekBalance={weekBalance}
              todayIndex={dayIndex}
              perfectInPlay={perfectInPlay}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: '#F5F2ED',
      overflow: 'hidden',
    }}>
      <HeroSection {...heroProps} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <TodayCard {...todayProps} />

        {!isWeekend && (
          <WeeklyProgressChart
            dailyBalances={dailyBalances}
            weekBalance={weekBalance}
            todayIndex={dayIndex}
            perfectInPlay={perfectInPlay}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
