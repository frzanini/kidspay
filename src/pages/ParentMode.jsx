import { useState, useEffect } from 'react'
import Header from '../components/shared/Header'
import TaskForm from '../components/config/TaskForm'
import { getDB } from '../lib/db'
import {
  getISOWeekId, pagesBonus,
  calcWeekSummary, calcFinal, hadPerfectWeek as checkPerfect,
} from '../lib/calculations'

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_META = {
  habito:        { label: 'Hábito',        color: '#8b5cf6' },
  obrigatorio:   { label: 'Obrigatório',   color: '#10b981' },
  so_penalidade: { label: 'Só penalidade', color: '#ef4444' },
  so_credito:    { label: 'Só crédito',    color: '#3b82f6' },
  simbolico:     { label: 'Simbólico',     color: '#64748b' },
}

const DEFAULT_CATEGORIES = ['Espiritual', 'Físico', 'Intelectual', 'Social', 'Emocional']
const AVATARS = ['🦁', '🦊', '🐬', '🦅', '🐺', '🦈']

function fmt(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Hooks ────────────────────────────────────────────────────────────────────

function useProfile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getDB()
      .then(db => db.get('profile', 'current'))
      .then(p => setProfile(p || {}))
  }, [])

  async function saveProfile(data) {
    const db = await getDB()
    await db.put('profile', data, 'current')
    setProfile(data)
  }

  return { profile, saveProfile }
}

function useTasks() {
  const [tasks, setTasks] = useState([])

  async function load() {
    const db = await getDB()
    setTasks(await db.getAll('tasks'))
  }

  useEffect(() => { load() }, [])

  async function saveTask(task) {
    const db = await getDB()
    await db.put('tasks', task)
    load()
  }

  async function deleteTask(id) {
    const db = await getDB()
    await db.delete('tasks', id)
    load()
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    if (task) await saveTask({ ...task, active: !task.active })
  }

  return { tasks, saveTask, deleteTask, toggleTask }
}

function useWeekData(weekId) {
  const [entries,      setEntries]      = useState([])
  const [alreadyClosed, setAlreadyClosed] = useState(false)

  async function load() {
    const db = await getDB()
    const [all, week] = await Promise.all([
      db.getAllFromIndex('checklist', 'weekId', weekId),
      db.get('weeks', weekId),
    ])
    setEntries(all)
    setAlreadyClosed(!!week)
  }

  useEffect(() => { load() }, [weekId])

  async function closeWeek(weekData) {
    const db = await getDB()
    await db.put('weeks', weekData)
    const tx  = db.transaction('checklist', 'readwrite')
    const all = await tx.store.index('weekId').getAll(weekId)
    for (const e of all) await tx.store.delete(e.id)
    await tx.done
    load()
  }

  return { entries, alreadyClosed, closeWeek }
}

function useWeeksHistory() {
  const [weeks, setWeeks] = useState([])

  async function load() {
    const db = await getDB()
    const allWeeks = await db.getAll('weeks')
    allWeeks.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    setWeeks(allWeeks)
  }

  useEffect(() => { load() }, [])

  return { weeks, load }
}

// ── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!value) }}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none',
        background: value ? '#10b981' : '#334155',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
      }} />
    </button>
  )
}

// ── Task item ────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onEdit }) {
  const meta = TYPE_META[task.type] || TYPE_META.simbolico

  const valueLabel = [
    task.credit ? `+${fmt(task.credit)}` : null,
    task.debit  ? `-${fmt(task.debit)}`  : null,
  ].filter(Boolean).join(' / ')

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: '#1e293b',
        borderRadius: 14, marginBottom: 8,
        opacity: task.active ? 1 : 0.45,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Type color dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: meta.color,
        boxShadow: `0 0 6px ${meta.color}88`,
      }} />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, color: '#f1f5f9', fontSize: 14, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.name}
        </p>
        <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>
          <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
          {valueLabel ? <span style={{ color: '#475569' }}> · {valueLabel}</span> : null}
        </p>
      </div>

      {/* Toggle */}
      <Toggle value={task.active} onChange={() => onToggle(task.id)} />

      {/* Edit */}
      <button
        onClick={() => onEdit(task)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: '#334155', color: '#94a3b8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}
      >
        ✏️
      </button>
    </div>
  )
}

// ── Totals card ──────────────────────────────────────────────────────────────

function TotalsCard({ tasks }) {
  const active = tasks.filter(t => t.active)

  let totalCredits = 0
  let totalDebits  = 0

  for (const t of active) {
    if (t.type !== 'so_penalidade' && t.credit) totalCredits += t.credit
    if ((t.type === 'habito' || t.type === 'so_penalidade') && t.debit) totalDebits += t.debit
  }

  const balance       = totalCredits - totalDebits
  const debitsExceed  = totalDebits > totalCredits

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Warning banner */}
      {debitsExceed && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '10px 14px',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ margin: 0, color: '#fca5a5', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
            Os débitos superam os créditos. O filho pode terminar a semana no negativo.
          </p>
        </div>
      )}

      {/* Summary card */}
      <div style={{
        background: '#1e293b', borderRadius: 16,
        padding: '14px 16px', border: '1px solid #334155',
      }}>
        <p style={{
          margin: '0 0 12px', color: '#64748b', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Potencial semanal · {active.length} tarefas ativas
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'rgba(16,185,129,0.08)',
            borderRadius: 12, padding: '10px 12px',
            border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
              Créditos
            </p>
            <p style={{
              margin: 0, fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 18, fontWeight: 700, color: '#10b981',
            }}>
              +{fmt(totalCredits)}
            </p>
          </div>
          <div style={{
            flex: 1, background: 'rgba(239,68,68,0.08)',
            borderRadius: 12, padding: '10px 12px',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
              Débitos
            </p>
            <p style={{
              margin: 0, fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 18, fontWeight: 700,
              color: debitsExceed ? '#ef4444' : '#f87171',
            }}>
              −{fmt(totalDebits)}
            </p>
          </div>
          <div style={{
            flex: 1, background: debitsExceed ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
            borderRadius: 12, padding: '10px 12px',
            border: `1px solid ${debitsExceed ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'}`,
          }}>
            <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
              Saldo
            </p>
            <p style={{
              margin: 0, fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 18, fontWeight: 700,
              color: debitsExceed ? '#ef4444' : '#3b82f6',
            }}>
              {balance >= 0 ? '' : '−'}{fmt(Math.abs(balance))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tasks tab ────────────────────────────────────────────────────────────────

function TasksTab({ tasks, onToggle, onEdit, onNew }) {
  if (tasks.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
        <h3 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px',
        }}>
          Nenhuma tarefa ainda
        </h3>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          Adicione tarefas para o seu filho começar a ganhar recompensas
        </p>
        <button
          onClick={onNew}
          style={{
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: '#10b981', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          + Criar primeira tarefa
        </button>
      </div>
    )
  }

  // Group by category — default order first, then custom
  const customCats = tasks
    .map(t => t.category)
    .filter(c => !DEFAULT_CATEGORIES.includes(c))
  const orderedCats = [...new Set([...DEFAULT_CATEGORIES, ...customCats])]

  const grouped = {}
  for (const task of tasks) {
    if (!grouped[task.category]) grouped[task.category] = []
    grouped[task.category].push(task)
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <TotalsCard tasks={tasks} />
      {orderedCats
        .filter(cat => grouped[cat]?.length > 0)
        .map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <p style={{
              color: '#475569', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              margin: '0 0 8px 4px',
            }}>
              {cat}
              <span style={{ color: '#334155', marginLeft: 6 }}>
                {grouped[cat].length}
              </span>
            </p>
            {grouped[cat].map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
              />
            ))}
          </div>
        ))}
    </div>
  )
}

// ── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, onSave }) {
  const [childName,    setChildName]    = useState(profile?.childName    || '')
  const [photo,        setPhoto]        = useState(profile?.photo        || '🦁')
  const [weeklyGoal,   setWeeklyGoal]   = useState(profile?.weeklyGoal   || 28)
  const [tithePercent, setTithePercent] = useState(profile?.tithePercent || 10)
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
    if (!profile) return
    setChildName(profile.childName    || '')
    setPhoto(profile.photo            || '🦁')
    setWeeklyGoal(profile.weeklyGoal  || 28)
    setTithePercent(profile.tithePercent || 10)
  }, [profile])

  async function handleSave() {
    await onSave({ childName, photo, weeklyGoal, tithePercent })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px 20px 100px' }}>

      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #052e16, #064e3b)',
          border: '2.5px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, overflow: 'hidden',
        }}>
          {photo?.startsWith('data:')
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : photo}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {AVATARS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setPhoto(emoji)}
              style={{
                width: 44, height: 44, borderRadius: 12, fontSize: 24,
                border: `2px solid ${photo === emoji ? '#10b981' : 'transparent'}`,
                background: photo === emoji ? 'rgba(16,185,129,0.15)' : '#1e293b',
                cursor: 'pointer',
                transform: photo === emoji ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <label style={{
        display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
      }}>
        Nome
      </label>
      <input
        value={childName}
        onChange={e => setChildName(e.target.value)}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          border: `1.5px solid ${childName ? '#10b981' : '#334155'}`,
          background: '#1e293b', color: '#f1f5f9', fontSize: 16,
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
          outline: 'none', marginBottom: 26,
          boxSizing: 'border-box',
        }}
      />

      {/* Goal slider */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            color: '#94a3b8', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Meta semanal
          </span>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 20, color: '#10b981', fontWeight: 700,
          }}>
            {fmt(weeklyGoal)}
          </span>
        </div>
        <input
          type="range" min={5} max={100} step={0.5} value={weeklyGoal}
          onChange={e => setWeeklyGoal(Number(e.target.value))}
          className="kp-slider"
          style={{ '--fill': `${((weeklyGoal - 5) / 95) * 100}%`, '--clr': '#10b981', '--glow': 'rgba(16,185,129,0.2)' }}
        />
      </div>

      {/* Tithe slider */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            color: '#94a3b8', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Dízimo / poupança
          </span>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 20, color: '#3b82f6', fontWeight: 700,
          }}>
            {tithePercent}%
          </span>
        </div>
        <input
          type="range" min={0} max={30} step={1} value={tithePercent}
          onChange={e => setTithePercent(Number(e.target.value))}
          className="kp-slider"
          style={{ '--fill': `${(tithePercent / 30) * 100}%`, '--clr': '#3b82f6', '--glow': 'rgba(59,130,246,0.2)' }}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: saved ? '#065f46' : '#10b981',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          transition: 'background 0.3s',
        }}
      >
        {saved ? '✓ Salvo!' : 'Salvar alterações'}
      </button>
    </div>
  )
}

// ── Weekly closing tab ───────────────────────────────────────────────────────

function WeekClosingTab({ tasks, profile, onWeekClosed }) {
  const weekId = getISOWeekId()
  const { entries, alreadyClosed, closeWeek } = useWeekData(weekId)

  const [books,       setBooks]       = useState([])
  const [newTitle,    setNewTitle]    = useState('')
  const [newPages,    setNewPages]    = useState(50)
  const [celebration, setCelebration] = useState(false)
  const [done,        setDone]        = useState(false)

  const tithePercent = profile?.tithePercent || 10
  const childName    = profile?.childName    || 'Seu filho'

  const { credits, debits, subtotal } = calcWeekSummary(tasks, entries)
  const bookBonus  = books.reduce((s, b) => s + b.bonus, 0)
  const { gross, tithe, net } = calcFinal(subtotal, bookBonus, tithePercent)
  const perfect = checkPerfect(tasks, entries)
  const hasData = entries.some(e => e.checked)

  function addBook() {
    const title = newTitle.trim()
    if (!title) return
    setBooks(prev => [...prev, { title, pages: newPages, bonus: pagesBonus(newPages || 1) }])
    setNewTitle('')
    setNewPages(50)
  }

  async function handleConfirm() {
    await closeWeek({
      id: weekId,
      closedAt: new Date().toISOString(),
      grossTotal: gross,
      tithe,
      netTotal: net,
      hadPerfectWeek: perfect,
      books,
    })
    onWeekClosed?.()
    setCelebration(false)
    setDone(true)
  }

  if (alreadyClosed || done) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>
          Semana fechada!
        </h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Confira o Histórico para ver os detalhes.
        </p>
      </div>
    )
  }

  const row = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ color: '#6ee7b7', fontSize: 14 }}>{label}</span>
      <span style={{ color: color || '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding: '20px 16px 100px' }}>

      {/* Label semana */}
      <p style={{ color: '#475569', fontSize: 12, margin: '0 0 16px 2px', fontWeight: 600 }}>
        {weekId}
      </p>

      {/* Resumo checklist */}
      <div style={{ background: '#1e293b', borderRadius: 16, padding: '16px', border: '1px solid #334155', marginBottom: 14 }}>
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Resumo da semana
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Créditos', value: `+${fmt(credits)}`, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', color: '#10b981' },
            { label: 'Débitos',  value: `−${fmt(debits)}`,  bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.15)',  color: '#f87171' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} style={{ flex: 1, background: bg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${border}` }}>
              <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #334155', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: subtotal >= 0 ? '#10b981' : '#ef4444' }}>
            {fmt(subtotal)}
          </span>
        </div>
        {perfect && hasData && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(251,191,36,0.1)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.2)', textAlign: 'center' }}>
            <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>⭐ Semana perfeita!</span>
          </div>
        )}
      </div>

      {/* Livros */}
      <div style={{ background: '#1e293b', borderRadius: 16, padding: '16px', border: '1px solid #334155', marginBottom: 14 }}>
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Livros lidos
        </p>
        {books.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '10px 12px', background: '#0f172a', borderRadius: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{b.title}</p>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12 }}>{b.pages} págs · +{fmt(b.bonus)}</p>
            </div>
            <button onClick={() => setBooks(prev => prev.filter((_, j) => j !== i))}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          </div>
        ))}
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addBook()}
          placeholder="Título do livro"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="number" value={newPages} min={1}
              onChange={e => setNewPages(Number(e.target.value))}
              placeholder="Páginas"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ margin: '4px 0 0 2px', color: '#475569', fontSize: 11 }}>
              Bônus: +{fmt(pagesBonus(newPages || 1))}
            </p>
          </div>
          <button
            onClick={addBook} disabled={!newTitle.trim()}
            style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: newTitle.trim() ? '#10b981' : '#1e293b', color: newTitle.trim() ? '#fff' : '#475569', fontWeight: 700, fontSize: 14, cursor: newTitle.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Resultado final */}
      <div style={{ background: 'linear-gradient(135deg, #052e16, #064e3b)', borderRadius: 16, padding: '18px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 24 }}>
        <p style={{ margin: '0 0 14px', color: '#6ee7b7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Resultado final
        </p>
        {row('Subtotal', fmt(subtotal))}
        {bookBonus > 0 && row('Bônus livros', `+${fmt(bookBonus)}`, '#34d399')}
        {row(`Dízimo (${tithePercent}%)`, `−${fmt(tithe)}`, '#fbbf24')}
        <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>{childName} recebe</span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, fontWeight: 700, color: '#34d399' }}>
            {fmt(net)}
          </span>
        </div>
      </div>

      {/* Botão fechar */}
      <button
        onClick={() => setCelebration(true)}
        disabled={!hasData}
        style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: hasData ? '#10b981' : '#1e293b',
          color: hasData ? '#fff' : '#475569',
          fontSize: 15, fontWeight: 700, cursor: hasData ? 'pointer' : 'not-allowed',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: hasData ? '0 4px 20px rgba(16,185,129,0.35)' : 'none',
        }}
      >
        Fechar semana →
      </button>

      {/* Modal celebração */}
      {celebration && (
        <div
          onClick={() => setCelebration(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1e293b', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 360, textAlign: 'center', border: '1px solid #334155' }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
              Semana incrível!
            </h2>
            {perfect && (
              <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>⭐ Semana perfeita!</p>
            )}
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 6px' }}>{childName} vai receber</p>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 44, fontWeight: 700, color: '#34d399', margin: '0 0 4px' }}>
              {fmt(net)}
            </p>
            <p style={{ color: '#475569', fontSize: 12, margin: '0 0 24px' }}>
              Dízimo: {fmt(tithe)}
            </p>
            <button
              onClick={handleConfirm}
              style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#10b981', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 20px rgba(16,185,129,0.4)', marginBottom: 10 }}
            >
              Confirmar fechamento ✓
            </button>
            <button
              onClick={() => setCelebration(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Voltar e revisar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

function HistoryTab({ weeks }) {
  function formatClosedAt(isoDate) {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (weeks.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🗂️</div>
        <h3 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px',
        }}>
          Sem histórico ainda
        </h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
          Feche a primeira semana para começar a acompanhar a evolução.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <p style={{
        margin: '0 0 16px 2px', color: '#64748b',
        fontSize: 12, fontWeight: 600,
      }}>
        {weeks.length} {weeks.length === 1 ? 'semana registrada' : 'semanas registradas'}
      </p>

      {weeks.map(week => {
        const booksCount = week.books?.length || 0
        const booksLabel = booksCount > 0
          ? week.books.map(book => book.title).join(' · ')
          : 'Nenhum livro registrado'

        return (
          <div
            key={week.id}
            style={{
              background: '#1e293b',
              borderRadius: 18,
              padding: '16px',
              border: '1px solid #334155',
              marginBottom: 12,
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 12, marginBottom: 14,
            }}>
              <div>
                <p style={{
                  margin: '0 0 4px', color: '#94a3b8',
                  fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {week.id}
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  Fechada em {formatClosedAt(week.closedAt)}
                </p>
              </div>
              {week.hadPerfectWeek && (
                <span style={{
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24', fontSize: 10, fontWeight: 800,
                  padding: '4px 9px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>
                  Semana perfeita
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1, background: 'rgba(16,185,129,0.08)',
                borderRadius: 12, padding: '10px 12px',
                border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
                  Valor recebido
                </p>
                <p style={{
                  margin: 0, fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 22, fontWeight: 700, color: '#34d399',
                }}>
                  {fmt(week.netTotal || 0)}
                </p>
              </div>
              <div style={{
                minWidth: 112, background: '#0f172a',
                borderRadius: 12, padding: '10px 12px',
                border: '1px solid #334155',
              }}>
                <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, fontWeight: 600 }}>
                  Livros
                </p>
                <p style={{
                  margin: 0, fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 22, fontWeight: 700, color: '#f1f5f9',
                }}>
                  {booksCount}
                </p>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid #334155',
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>
                Dízimo: {fmt(week.tithe || 0)}
              </span>
              <span style={{
                color: '#475569', fontSize: 12, textAlign: 'right',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {booksLabel}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ParentMode() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [formTask,  setFormTask]  = useState(null)

  const { tasks, saveTask, deleteTask, toggleTask } = useTasks()
  const { profile, saveProfile } = useProfile()
  const { weeks, load: loadWeeks } = useWeeksHistory()

  useEffect(() => {
    if (activeTab === 'history') loadWeeks()
  }, [activeTab])

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...tasks.map(t => t.category).filter(c => !DEFAULT_CATEGORIES.includes(c)),
  ]

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0f172a', position: 'relative',
    }}>
      <Header />

      {/* Tab bar */}
      <div style={{
        flexShrink: 0, display: 'flex',
        borderBottom: '1px solid #1e293b', padding: '0 16px',
      }}>
        {[{ id: 'tasks', label: 'Tarefas' }, { id: 'week', label: 'Semana' }, { id: 'history', label: 'Histórico' }, { id: 'profile', label: 'Perfil' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '13px 18px', border: 'none', background: 'transparent',
              color: activeTab === tab.id ? '#10b981' : '#64748b',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.id ? '#10b981' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.2s',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            onToggle={toggleTask}
            onEdit={task => setFormTask(task)}
            onNew={() => setFormTask({})}
          />
        )}
        {activeTab === 'week' && profile !== null && (
          <WeekClosingTab tasks={tasks} profile={profile} onWeekClosed={loadWeeks} />
        )}
        {activeTab === 'history' && (
          <HistoryTab weeks={weeks} />
        )}
        {activeTab === 'profile' && profile !== null && (
          <ProfileTab profile={profile} onSave={saveProfile} />
        )}
      </div>

      {/* FAB — só na aba de tarefas quando há itens */}
      {activeTab === 'tasks' && tasks.length > 0 && (
        <button
          onClick={() => setFormTask({})}
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 56, height: 56, borderRadius: '50%', border: 'none',
            background: '#10b981', color: '#fff', fontSize: 26,
            cursor: 'pointer', boxShadow: '0 4px 24px rgba(16,185,129,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          +
        </button>
      )}

      {/* TaskForm bottom sheet */}
      {formTask !== null && (
        <TaskForm
          task={formTask}
          allCategories={[...new Set(allCategories)]}
          onSave={async data => { await saveTask(data); setFormTask(null) }}
          onDelete={async id => { await deleteTask(id); setFormTask(null) }}
          onClose={() => setFormTask(null)}
        />
      )}
    </div>
  )
}
