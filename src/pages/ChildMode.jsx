import { useState, useEffect } from 'react'
import Header from '../components/shared/Header'
import { getDB } from '../lib/db'

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ['Espiritual', 'Físico', 'Intelectual', 'Social', 'Emocional']
const DAY_NAMES  = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const DAY_SHORT  = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v) {
  if (!v && v !== 0) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getISOWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// 0=Seg, 1=Ter, ..., 4=Sex, 5=Sáb, 6=Dom
function getDayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7
}

function calcBalance(tasks, entries) {
  let total = 0
  for (const e of entries) {
    if (!e.checked) continue
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

// ── TaskItem ──────────────────────────────────────────────────────────────────

function TaskItem({ task, checked, onToggle }) {
  const [showCoin, setShowCoin] = useState(false)

  const isPenalty  = task.type === 'so_penalidade'
  const isSymbolic = task.type === 'simbolico'
  const checkColor = isPenalty ? '#ef4444' : '#10b981'

  const coinLabel = isPenalty
    ? (task.debit  ? `−${fmt(task.debit)}`  : null)
    : (task.credit ? `+${fmt(task.credit)}` : null)

  function handleTap() {
    const willCheck = !checked
    if (willCheck && coinLabel && !isSymbolic) {
      setShowCoin(true)
      setTimeout(() => setShowCoin(false), 850)
    }
    onToggle(task.id)
  }

  return (
    <div
      onClick={handleTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '15px 16px',
        background: checked
          ? (isPenalty ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)')
          : '#1e293b',
        borderRadius: 16, marginBottom: 10,
        border: `1.5px solid ${checked
          ? (isPenalty ? '#ef444430' : '#10b98130')
          : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', userSelect: 'none',
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          border: `2.5px solid ${checked ? checkColor : '#334155'}`,
          background: checked ? checkColor : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#fff', fontWeight: 800,
          transition: 'all 0.2s',
          animation: showCoin ? 'check-pop 0.3s ease-out' : 'none',
        }}
      >
        {checked && (isPenalty ? '✕' : '✓')}
      </div>

      {/* Name + hint */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 600,
          color: checked ? '#475569' : '#f1f5f9',
          textDecoration: checked && !isPenalty ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}>
          {task.name}
        </p>
        {isPenalty && !checked && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569', fontWeight: 500 }}>
            toque se não fez
          </p>
        )}
        {isSymbolic && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>simbólico</p>
        )}
      </div>

      {/* Static value (when checked) */}
      {checked && coinLabel && (
        <span style={{ fontSize: 13, fontWeight: 700, color: checkColor, flexShrink: 0 }}>
          {coinLabel}
        </span>
      )}

      {/* Coin fly animation */}
      {showCoin && coinLabel && (
        <span
          style={{
            position: 'absolute', right: 16, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13, fontWeight: 800, color: checkColor,
            animation: 'coin-fly 0.85s ease-out forwards',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}
        >
          {coinLabel}
        </span>
      )}
    </div>
  )
}

// ── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({ weekBalance, weeklyGoal, todayBalance, perfectInPlay }) {
  const pct = Math.min(Math.max((weekBalance / weeklyGoal) * 100, 0), 100)

  return (
    <div style={{
      background: '#1e293b', borderRadius: 20,
      padding: '18px 18px 16px', border: '1px solid #334155',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
      }}>
        <span style={{
          color: '#64748b', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Meta da semana
        </span>
        {perfectInPlay && (
          <span style={{
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.25)',
            color: '#fbbf24', fontSize: 10, fontWeight: 800,
            padding: '3px 9px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            ⭐ Semana perfeita em jogo
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 10, background: '#334155',
        borderRadius: 5, marginBottom: 12, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 5,
          width: `${pct}%`,
          background: pct >= 100
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : 'linear-gradient(90deg, #10b981, #6ee7b7)',
          transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 0 10px rgba(16,185,129,0.4)',
        }} />
      </div>

      {/* Values */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 11, marginBottom: 2 }}>
            Acumulado
          </p>
          <p style={{
            margin: 0,
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 28, fontWeight: 700,
            color: weekBalance >= 0 ? '#10b981' : '#ef4444',
            transition: 'color 0.3s',
          }}>
            {fmt(weekBalance)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: 11, marginBottom: 2 }}>Meta</p>
          <p style={{
            margin: 0, color: '#475569', fontSize: 20, fontWeight: 700,
            fontFamily: 'Fraunces, Georgia, serif',
          }}>
            {fmt(weeklyGoal)}
          </p>
        </div>
      </div>

      {/* Today's line */}
      {todayBalance !== 0 && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Hoje</span>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: todayBalance >= 0 ? '#10b981' : '#ef4444',
          }}>
            {todayBalance > 0 ? '+' : ''}{fmt(todayBalance)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ChildMode() {
  const [tasks,   setTasks]   = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const today    = new Date()
  const weekId   = getISOWeekId(today)
  const dayIndex = getDayIndex(today)
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

  // ── Calculations ──
  const weeklyGoal  = profile?.weeklyGoal || 28
  const weekBalance = calcBalance(tasks, entries)
  const todayBalance = calcBalance(tasks, entries.filter(e => e.dayIndex === dayIndex))
  const progressPct  = Math.min((weekBalance / weeklyGoal) * 100, 100)

  // Perfect week: no so_penalidade with affectsStreak has been checked (= failed) this week
  const anyFailed = entries.some(e => {
    if (!e.checked) return false
    const t = tasks.find(t => t.id === e.taskId)
    return t?.type === 'so_penalidade' && t?.affectsStreak
  })
  const perfectInPlay = !anyFailed

  // ── Group tasks ──
  const customCats  = tasks.map(t => t.category).filter(c => !DEFAULT_CATEGORIES.includes(c))
  const orderedCats = [...new Set([...DEFAULT_CATEGORIES, ...customCats])]
  const grouped     = {}
  for (const task of tasks) {
    if (!grouped[task.category]) grouped[task.category] = []
    grouped[task.category].push(task)
  }
  const activeCats = orderedCats.filter(c => grouped[c]?.length > 0)

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{
        height: '100dvh', background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#475569', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Carregando…
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <Header />

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Profile greeting ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 14, marginBottom: 20,
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #052e16, #064e3b)',
              border: '2.5px solid #10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, overflow: 'hidden',
            }}>
              {profile?.photo?.startsWith('data:')
                ? <img src={profile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile?.photo || '🦁')}
            </div>
            <div>
              <p style={{
                margin: 0, color: '#64748b', fontSize: 12,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Olá,
              </p>
              <p style={{
                margin: 0,
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 22, fontWeight: 700, color: '#f1f5f9',
              }}>
                {profile?.childName || 'Campeão'}! 👋
              </p>
            </div>
          </div>

          {/* Day of week dots (Mon–Fri) */}
          {!isWeekend && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {DAY_SHORT.map((d, i) => {
                const isToday  = i === dayIndex
                const isPast   = i < dayIndex
                return (
                  <div
                    key={d}
                    style={{
                      flex: 1, textAlign: 'center', padding: '7px 0',
                      borderRadius: 10,
                      background: isToday ? '#10b981' : '#1e293b',
                      border: `1.5px solid ${isToday ? '#10b981' : (isPast ? '#10b98150' : '#334155')}`,
                    }}
                  >
                    <p style={{
                      margin: 0, fontSize: 10, fontWeight: 700,
                      color: isToday ? '#fff' : (isPast ? '#10b981' : '#475569'),
                    }}>
                      {isPast ? '✓' : d}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Progress card ── */}
        <div style={{ padding: '0 20px 20px' }}>
          <ProgressCard
            weekBalance={weekBalance}
            weeklyGoal={weeklyGoal}
            todayBalance={todayBalance}
            perfectInPlay={perfectInPlay}
          />
        </div>

        {/* ── Weekend ── */}
        {isWeekend ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h3 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px',
            }}>
              Bom fim de semana!
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
              Hoje não há tarefas.<br />Aproveite e descanse!
            </p>
          </div>

        ) : tasks.length === 0 ? (

          /* ── Empty ── */
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <h3 style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px',
            }}>
              Sem tarefas ainda
            </h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Peça para seus pais configurarem as tarefas!
            </p>
          </div>

        ) : (

          /* ── Task list ── */
          <div style={{ padding: '0 16px 40px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', margin: '0 4px 14px',
            }}>
              <p style={{
                margin: 0, color: '#64748b', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {DAY_NAMES[dayIndex]}
              </p>
              <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 600 }}>
                {entries.filter(e => e.dayIndex === dayIndex && e.checked).length}
                /{tasks.length} feitas
              </p>
            </div>

            {activeCats.map(cat => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <p style={{
                  color: '#475569', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  margin: '0 0 8px 4px',
                }}>
                  {cat}
                </p>
                {grouped[cat].map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    checked={isChecked(task.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
