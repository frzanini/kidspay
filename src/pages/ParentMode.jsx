import { useState, useEffect } from 'react'
import { useInstallPrompt } from '../lib/useInstallPrompt'
import BottomNav from '../components/shared/BottomNav'
import AvatarPicker from '../components/shared/AvatarPicker'
import TaskForm from '../components/config/TaskForm'
import { getDB } from '../lib/db'
import { UI_ICONS } from '../lib/icons'
import { resolveAvatar } from '../lib/avatarAssets'
import {
  getISOWeekId, pagesBonus,
  calcWeekSummary, calcFinal, hadPerfectWeek as checkPerfect,
} from '../lib/calculations'

// -- Constants ----------------------------------------------------------------

const TYPE_META = {
  habito:        { label: 'Hábito',        color: '#8b5cf6' },
  obrigatorio:   { label: 'Obrigatório',   color: '#5C8C3E' },
  so_penalidade: { label: 'Só penalidade', color: '#ef4444' },
  so_credito:    { label: 'Só crédito',    color: '#3b82f6' },
  simbolico:     { label: 'Simbólico',     color: '#888'    },
}

const DEFAULT_CATEGORIES = ['Espiritual', 'Físico', 'Intelectual', 'Social', 'Emocional']

function fmt(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// -- Hooks --------------------------------------------------------------------

function useProfile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getDB()
      .then(db => db.get('profile', 'current'))
      .then(p => setProfile(p || {}))
  }, [])

  async function saveProfile(data) {
    const db = await getDB()
    const merged = { ...(profile || {}), ...data }
    await db.put('profile', merged, 'current')
    setProfile(merged)
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
  const [entries,       setEntries]       = useState([])
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

// -- Toggle ------------------------------------------------------------------

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!value) }}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none',
        background: value ? '#5C8C3E' : '#D1D5DB',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// -- TaskItem ----------------------------------------------------------------

function TaskItem({ task, onToggle, onEdit }) {
  const meta = TYPE_META[task.type] || TYPE_META.simbolico

  const valueLabel = [
    task.credit ? `+${fmt(task.credit)}` : null,
    task.debit  ? `-${fmt(task.debit)}`  : null,
  ].filter(Boolean).join(' / ')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 14px', background: '#fff',
      borderRadius: 14, marginBottom: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      opacity: task.active ? 1 : 0.45,
      transition: 'opacity 0.2s',
    }}>
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: meta.color, boxShadow: `0 0 6px ${meta.color}66`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: '#1A1A1A', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.name}
        </p>
        <p style={{ margin: '3px 0 0', color: '#888', fontSize: 12 }}>
          <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
          {valueLabel ? <span> · {valueLabel}</span> : null}
        </p>
      </div>
      <Toggle value={task.active} onChange={() => onToggle(task.id)} />
      <button
        onClick={() => onEdit(task)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: '#F5F2ED', color: '#5C8C3E', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}
      >
        {UI_ICONS.edit}
      </button>
    </div>
  )
}

// -- TotalsCard --------------------------------------------------------------

function TotalsCard({ tasks }) {
  const active = tasks.filter(t => t.active)
  let totalCredits = 0, totalDebits = 0

  for (const t of active) {
    if (t.type !== 'so_penalidade' && t.credit) totalCredits += t.credit
    if ((t.type === 'habito' || t.type === 'so_penalidade') && t.debit) totalDebits += t.debit
  }

  const balance      = totalCredits - totalDebits
  const debitsExceed = totalDebits > totalCredits

  return (
    <div style={{ marginBottom: 20 }}>
      {debitsExceed && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{UI_ICONS.warning}</span>
          <p style={{ margin: 0, color: '#ef4444', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
            Os débitos superam os créditos. Seu filho pode terminar a semana no negativo.
          </p>
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <p style={{ margin: '0 0 12px', color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Potencial semanal · {active.length} tarefas ativas
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Créditos', value: `+${fmt(totalCredits)}`, bg: 'rgba(92,140,62,0.08)', border: 'rgba(92,140,62,0.2)', color: '#5C8C3E' },
            { label: 'Débitos',  value: `-${fmt(totalDebits)}`,  bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: debitsExceed ? '#ef4444' : '#f87171' },
            { label: 'Saldo',    value: `${balance >= 0 ? '' : '-'}${fmt(Math.abs(balance))}`, bg: debitsExceed ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', border: debitsExceed ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: debitsExceed ? '#ef4444' : '#3b82f6' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} style={{ flex: 1, background: bg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${border}` }}>
              <p style={{ margin: '0 0 2px', color: '#888', fontSize: 11, fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// -- TasksTab ----------------------------------------------------------------

function TasksTab({ tasks, onToggle, onEdit, onNew }) {
  if (tasks.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{UI_ICONS.checklist}</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
          Nenhuma tarefa ainda
        </h3>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          Cadastre ou ative tarefas antes de liberar o modo filho.
        </p>
        <button
          onClick={onNew}
          style={{
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: '#5C8C3E', color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(92,140,62,0.35)',
          }}
        >
          + Cadastrar primeira tarefa
        </button>
      </div>
    )
  }

  const customCats  = tasks.map(t => t.category).filter(c => !DEFAULT_CATEGORIES.includes(c))
  const orderedCats = [...new Set([...DEFAULT_CATEGORIES, ...customCats])]
  const grouped     = {}
  for (const task of tasks) {
    if (!grouped[task.category]) grouped[task.category] = []
    grouped[task.category].push(task)
  }

  return (
    <div style={{ padding: '16px 16px 120px' }}>
      <TotalsCard tasks={tasks} />
      {orderedCats.filter(cat => grouped[cat]?.length > 0).map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <p style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 4px' }}>
            {cat} <span style={{ color: '#D1D5DB' }}>{grouped[cat].length}</span>
          </p>
          {grouped[cat].map(task => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
          ))}
        </div>
      ))}
    </div>
  )
}

// -- ProfileTab --------------------------------------------------------------

function ProfileTab({ profile, onSave }) {
  const { canInstall, promptInstall }        = useInstallPrompt()
  const [childName,      setChildName]      = useState(profile?.childName      || '')
  const [photo,          setPhoto]          = useState(profile?.photo          || 'garota1.png')
  const [weeklyGoal,     setWeeklyGoal]     = useState(profile?.weeklyGoal     || 28)
  const [titheEnabled,   setTitheEnabled]   = useState(profile?.titheEnabled   ?? true)
  const [tithePercent,   setTithePercent]   = useState(profile?.tithePercent   || 10)
  const [savingsEnabled, setSavingsEnabled] = useState(profile?.savingsEnabled ?? false)
  const [savingsPercent, setSavingsPercent] = useState(profile?.savingsPercent || 10)
  const [saved,          setSaved]          = useState(false)

  useEffect(() => {
    if (!profile) return
    setChildName(profile.childName      || '')
    setPhoto(profile.photo              || 'garota1.png')
    setWeeklyGoal(profile.weeklyGoal    || 28)
    setTitheEnabled(profile.titheEnabled  ?? true)
    setTithePercent(profile.tithePercent  || 10)
    setSavingsEnabled(profile.savingsEnabled ?? false)
    setSavingsPercent(profile.savingsPercent || 10)
  }, [profile])

  async function handleSave() {
    await onSave({ childName, photo, weeklyGoal, titheEnabled, tithePercent, savingsEnabled, savingsPercent })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px 20px 120px' }}>

      {/* Preview do avatar atual */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src={resolveAvatar(photo)}
          alt={childName}
          style={{
            width: 90, height: 90, borderRadius: '50%',
            objectFit: 'cover', margin: '0 auto',
            border: '3px solid #5C8C3E',
            boxShadow: '0 0 0 5px rgba(92,140,62,0.15)',
            display: 'block',
          }}
        />
      </div>

      {/* AvatarPicker */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <AvatarPicker value={photo} onChange={setPhoto} />
      </div>

      {/* Nome */}
      <label style={labelStyle}>Nome da criança</label>
      <input
        value={childName}
        onChange={e => setChildName(e.target.value)}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          border: `1.5px solid ${childName ? '#5C8C3E' : '#E5E7EB'}`,
          background: '#fff', color: '#1A1A1A', fontSize: 16, fontWeight: 600,
          outline: 'none', marginBottom: 24, boxSizing: 'border-box',
        }}
      />

      {/* Meta semanal */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '18px', marginBottom: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700 }}>Meta semanal</span>
          <span style={{ fontSize: 20, color: '#5C8C3E', fontWeight: 800 }}>{fmt(weeklyGoal)}</span>
        </div>
        <input
          type="range" min={5} max={100} step={0.5} value={weeklyGoal}
          onChange={e => setWeeklyGoal(Number(e.target.value))}
          className="kp-slider"
          style={{ '--fill': `${((weeklyGoal - 5) / 95) * 100}%`, '--clr': '#5C8C3E', '--glow': 'rgba(92,140,62,0.2)' }}
        />
      </div>

      <ProfileDeductionControl label="Dízimo"   enabled={titheEnabled}   onToggle={() => setTitheEnabled(v => !v)}   percent={tithePercent}   onChange={setTithePercent}   color="#3b82f6" />
      <ProfileDeductionControl label="Poupança" enabled={savingsEnabled} onToggle={() => setSavingsEnabled(v => !v)} percent={savingsPercent} onChange={setSavingsPercent} color="#F59E0B" />

      <button
        onClick={handleSave}
        style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: saved ? '#3d6129' : '#5C8C3E',
          color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(92,140,62,0.3)',
          transition: 'background 0.3s',
        }}
      >
        {saved ? '✓ Salvo!' : 'Salvar alterações'}
      </button>

      {canInstall && (
        <button
          onClick={promptInstall}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: '2px solid #4338ca',
            background: 'transparent',
            color: '#4338ca', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          📲 Instalar app no celular
        </button>
      )}
    </div>
  )
}

function ProfileDeductionControl({ label, enabled, onToggle, percent, onChange, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: enabled ? 10 : 0 }}>
        <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700 }}>{label}</span>
        <button
          onClick={onToggle}
          style={{
            minWidth: 96, height: 32, borderRadius: 999,
            border: `1.5px solid ${enabled ? color : '#E5E7EB'}`,
            background: enabled ? `${color}14` : 'transparent',
            color: enabled ? color : '#888',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {enabled ? `${percent}%` : 'Desligado'}
        </button>
      </div>
      {enabled && (
        <input
          type="range" min={0} max={30} step={1} value={percent}
          onChange={e => onChange(Number(e.target.value))}
          className="kp-slider"
          style={{ '--fill': `${(percent / 30) * 100}%`, '--clr': color, '--glow': `${color}33` }}
        />
      )}
    </div>
  )
}

// -- WeekClosingTab ----------------------------------------------------------

function WeekClosingTab({ tasks, profile, onWeekClosed }) {
  const weekId = getISOWeekId()
  const { entries, alreadyClosed, closeWeek } = useWeekData(weekId)

  const [books,       setBooks]       = useState([])
  const [newTitle,    setNewTitle]    = useState('')
  const [newPages,    setNewPages]    = useState(50)
  const [celebration, setCelebration] = useState(false)
  const [done,        setDone]        = useState(false)

  const titheEnabled   = profile?.titheEnabled   ?? true
  const tithePercent   = titheEnabled   ? (profile?.tithePercent   || 10) : 0
  const savingsEnabled = profile?.savingsEnabled ?? false
  const savingsPercent = savingsEnabled ? (profile?.savingsPercent || 10) : 0
  const childName      = profile?.childName || 'Seu filho'

  const { credits, debits, subtotal } = calcWeekSummary(tasks, entries)
  const bookBonus = books.reduce((s, b) => s + b.bonus, 0)
  const { gross, tithe, savings, net } = calcFinal(subtotal, bookBonus, tithePercent, savingsPercent)
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
    await closeWeek({ id: weekId, closedAt: new Date().toISOString(), grossTotal: gross, tithe, savings, netTotal: net, hadPerfectWeek: perfect, books })
    onWeekClosed?.()
    setCelebration(false)
    setDone(true)
  }

  if (alreadyClosed || done) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>Semana fechada!</h3>
        <p style={{ color: '#888', fontSize: 14 }}>Confira o Histórico para ver os detalhes.</p>
      </div>
    )
  }

  const row = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ color: '#888', fontSize: 14 }}>{label}</span>
      <span style={{ color: color || '#1A1A1A', fontWeight: 600, fontSize: 14 }}>{value}</span>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid #E5E7EB', background: '#F5F2ED',
    color: '#1A1A1A', fontSize: 14, outline: 'none',
    marginBottom: 8, boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '20px 16px 120px' }}>
      <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px 2px', fontWeight: 600 }}>{weekId}</p>

      {/* Resumo */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 14 }}>
        <p style={{ margin: '0 0 12px', color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Resumo da semana
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Créditos', value: `+${fmt(credits)}`, bg: 'rgba(92,140,62,0.08)',  border: 'rgba(92,140,62,0.2)',  color: '#5C8C3E' },
            { label: 'Débitos',  value: `-${fmt(debits)}`,  bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#ef4444' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} style={{ flex: 1, background: bg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${border}` }}>
              <p style={{ margin: '0 0 2px', color: '#888', fontSize: 11, fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 13, fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: subtotal >= 0 ? '#5C8C3E' : '#ef4444' }}>{fmt(subtotal)}</span>
        </div>
        {perfect && hasData && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(251,191,36,0.1)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.3)', textAlign: 'center' }}>
            <span style={{ color: '#D97706', fontSize: 12, fontWeight: 800 }}>⭐ Semana perfeita!</span>
          </div>
        )}
      </div>

      {/* Livros */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 14 }}>
        <p style={{ margin: '0 0 12px', color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Livros lidos
        </p>
        {books.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '10px 12px', background: '#F5F2ED', borderRadius: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#1A1A1A', fontSize: 14, fontWeight: 600 }}>{b.title}</p>
              <p style={{ margin: '2px 0 0', color: '#888', fontSize: 12 }}>{b.pages} págs · +{fmt(b.bonus)}</p>
            </div>
            <button onClick={() => setBooks(prev => prev.filter((_, j) => j !== i))}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#E5E7EB', color: '#888', cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          </div>
        ))}
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBook()} placeholder="Título do livro" style={inputStyle} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input type="number" value={newPages} min={1} onChange={e => setNewPages(Number(e.target.value))} placeholder="Páginas" style={{ ...inputStyle, marginBottom: 0 }} />
            <p style={{ margin: '4px 0 0 2px', color: '#888', fontSize: 11 }}>Bônus: +{fmt(pagesBonus(newPages || 1))}</p>
          </div>
          <button
            onClick={addBook} disabled={!newTitle.trim()}
            style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: newTitle.trim() ? '#5C8C3E' : '#E5E7EB', color: newTitle.trim() ? '#fff' : '#888', fontWeight: 800, fontSize: 14, cursor: newTitle.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Resultado final */}
      <div style={{ background: 'linear-gradient(135deg, #5C8C3E, #3d6129)', borderRadius: 16, padding: '18px', marginBottom: 24 }}>
        <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Resultado final
        </p>
        {row('Subtotal', fmt(subtotal), '#fff')}
        {bookBonus > 0 && row('Bônus livros', `+${fmt(bookBonus)}`, '#D4F5B0')}
        {titheEnabled  && row(`Dízimo (${tithePercent}%)`,   `-${fmt(tithe)}`,   '#FDE68A')}
        {savingsEnabled && row(`Poupança (${savingsPercent}%)`, `-${fmt(savings)}`, '#FCD34D')}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>{childName} recebe</span>
          <span style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>{fmt(net)}</span>
        </div>
      </div>

      <button
        onClick={() => setCelebration(true)}
        disabled={!hasData}
        style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: hasData ? '#5C8C3E' : '#E5E7EB',
          color: hasData ? '#fff' : '#888',
          fontSize: 15, fontWeight: 800, cursor: hasData ? 'pointer' : 'not-allowed',
          boxShadow: hasData ? '0 4px 20px rgba(92,140,62,0.35)' : 'none',
        }}
      >
        Fechar semana 🎉
      </button>

      {/* Modal confirmação */}
      {celebration && (
        <div onClick={() => setCelebration(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{UI_ICONS.celebrate}</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>Semana incrível!</h2>
            {perfect && <p style={{ color: '#D97706', fontSize: 13, fontWeight: 800, margin: '0 0 12px' }}>⭐ Semana perfeita!</p>}
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 6px' }}>{childName} vai receber</p>
            <p style={{ fontSize: 44, fontWeight: 800, color: '#5C8C3E', margin: '0 0 4px' }}>{fmt(net)}</p>
            <p style={{ color: '#888', fontSize: 12, margin: '0 0 24px' }}>Dízimo: {fmt(tithe)} | Poupança: {fmt(savings)}</p>
            <button onClick={handleConfirm}
              style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#5C8C3E', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(92,140,62,0.4)', marginBottom: 10 }}>
              Confirmar fechamento ✓
            </button>
            <button onClick={() => setCelebration(false)}
              style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer' }}>
              Voltar e revisar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// -- HistoryTab --------------------------------------------------------------

function HistoryTab({ weeks }) {
  function formatClosedAt(isoDate) {
    return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (weeks.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{UI_ICONS.history}</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>Sem histórico ainda</h3>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>Feche a primeira semana para começar a acompanhar a evolução.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px 120px' }}>
      <p style={{ margin: '0 0 16px 2px', color: '#888', fontSize: 12, fontWeight: 600 }}>
        {weeks.length} {weeks.length === 1 ? 'semana registrada' : 'semanas registradas'}
      </p>
      {weeks.map(week => {
        const booksCount = week.books?.length || 0
        const booksLabel = booksCount > 0 ? week.books.map(b => b.title).join(' · ') : 'Nenhum livro'
        return (
          <div key={week.id} style={{ background: '#fff', borderRadius: 18, padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{week.id}</p>
                <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Fechada em {formatClosedAt(week.closedAt)}</p>
              </div>
              {week.hadPerfectWeek && (
                <span style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#D97706', fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 999, flexShrink: 0 }}>
                  Semana perfeita
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, background: 'rgba(92,140,62,0.08)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(92,140,62,0.2)' }}>
                <p style={{ margin: '0 0 2px', color: '#888', fontSize: 11, fontWeight: 600 }}>Valor recebido</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#5C8C3E' }}>{fmt(week.netTotal || 0)}</p>
              </div>
              <div style={{ minWidth: 100, background: '#F5F2ED', borderRadius: 12, padding: '10px 12px', border: '1px solid #E8E4DE' }}>
                <p style={{ margin: '0 0 2px', color: '#888', fontSize: 11, fontWeight: 600 }}>Livros</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1A1A1A' }}>{booksCount}</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Dízimo: {fmt(week.tithe || 0)} | Poupança: {fmt(week.savings || 0)}</span>
              <span style={{ color: '#888', fontSize: 12, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booksLabel}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// -- Main --------------------------------------------------------------------

const TABS = [
  { id: 'tasks',   label: 'Tarefas'   },
  { id: 'week',    label: 'Semana'    },
  { id: 'history', label: 'Histórico' },
  { id: 'profile', label: 'Perfil'    },
]

export default function ParentMode() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [formTask,  setFormTask]  = useState(null)

  const { tasks, saveTask, deleteTask, toggleTask } = useTasks()
  const { profile, saveProfile }                    = useProfile()
  const { weeks, load: loadWeeks }                  = useWeeksHistory()

  useEffect(() => {
    if (activeTab === 'history') loadWeeks()
  }, [activeTab])

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...tasks.map(t => t.category).filter(c => !DEFAULT_CATEGORIES.includes(c)),
  ]

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F5F2ED' }}>

      {/* Tab bar */}
      <div style={{ flexShrink: 0, padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: 16, padding: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
                background: activeTab === tab.id ? '#5C8C3E' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#888',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'tasks'   && <TasksTab tasks={tasks} onToggle={toggleTask} onEdit={task => setFormTask(task)} onNew={() => setFormTask({})} />}
        {activeTab === 'week'    && profile !== null && <WeekClosingTab tasks={tasks} profile={profile} onWeekClosed={loadWeeks} />}
        {activeTab === 'history' && <HistoryTab weeks={weeks} />}
        {activeTab === 'profile' && profile !== null && <ProfileTab profile={profile} onSave={saveProfile} />}
      </div>

      {/* FAB — aba Tarefas */}
      {activeTab === 'tasks' && tasks.length > 0 && (
        <button
          onClick={() => setFormTask({})}
          style={{
            position: 'fixed', bottom: 88, right: 20,
            width: 56, height: 56, borderRadius: '50%', border: 'none',
            background: '#5C8C3E', color: '#fff', fontSize: 26,
            cursor: 'pointer', boxShadow: '0 4px 24px rgba(92,140,62,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          +
        </button>
      )}

      <BottomNav />

      {/* TaskForm modal */}
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

// -- Shared style ------------------------------------------------------------

const labelStyle = {
  display: 'block',
  color: '#888', fontSize: 12, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 8,
}
