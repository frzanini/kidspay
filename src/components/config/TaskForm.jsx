import { useState, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'habito',        label: 'Hábito',      icon: '🔄', color: '#8b5cf6', desc: 'Crédito se fizer, débito se não fizer', hasCredit: true,  hasDebit: true,  affectsStreak: true },
  { id: 'obrigatorio',   label: 'Obrigatório', icon: '✅', color: '#5C8C3E', desc: 'Crédito fixo garantido',                 hasCredit: true,  hasDebit: false, affectsStreak: true },
  { id: 'so_penalidade', label: 'Penalidade',  icon: '⚠️', color: '#ef4444', desc: 'Débito se não fizer',                   hasCredit: false, hasDebit: true,  affectsStreak: true },
  { id: 'so_credito',    label: 'Bônus',       icon: '⭐', color: '#3b82f6', desc: 'Crédito se fizer (opcional)',            hasCredit: true,  hasDebit: false, affectsStreak: false },
  { id: 'simbolico',     label: 'Simbólico',   icon: '🤝', color: '#888',    desc: 'Sem impacto financeiro',                hasCredit: false, hasDebit: false, affectsStreak: false },
]

const TYPE_DEFAULTS = {
  habito:        { credit: 0.50, debit: 0.50 },
  obrigatorio:   { credit: 0.50, debit: null },
  so_penalidade: { credit: null, debit: 0.50 },
  so_credito:    { credit: 0.50, debit: null },
  simbolico:     { credit: null, debit: null },
}

function fmt(v) {
  if (!v && v !== 0) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getPreview(type, credit, debit) {
  switch (type) {
    case 'habito':        return `✓ Fez: +${fmt(credit)} · ✗ Não fez: −${fmt(debit)}`
    case 'obrigatorio':   return `✓ Fez: +${fmt(credit)}`
    case 'so_penalidade': return `✗ Não fez: −${fmt(debit)}`
    case 'so_credito':    return `✓ Fez: +${fmt(credit)} (opcional)`
    case 'simbolico':     return 'Tarefa simbólica — sem impacto financeiro'
    default: return ''
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskForm({ task, allCategories, onSave, onDelete, onClose }) {
  const isEditing = !!task.id

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  const initType     = task.type     || 'habito'
  const initDefaults = TYPE_DEFAULTS[initType]

  const [name,          setName]         = useState(task.name     || '')
  const [type,          setType]         = useState(initType)
  const [category,      setCategory]     = useState(task.category || allCategories[0] || 'Espiritual')
  const [credit,        setCredit]       = useState(task.credit   ?? initDefaults.credit)
  const [debit,         setDebit]        = useState(task.debit    ?? initDefaults.debit)
  const [active,        setActive]       = useState(task.active   !== false)
  const [showNewCat,    setShowNewCat]   = useState(false)
  const [newCatValue,   setNewCatValue]  = useState('')
  const [extraCats,     setExtraCats]    = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentType = TASK_TYPES.find(t => t.id === type)
  const categories  = [...new Set([...allCategories, ...extraCats])]

  function handleTypeChange(newType) {
    setType(newType)
    const d = TYPE_DEFAULTS[newType]
    setCredit(d.credit)
    setDebit(d.debit)
  }

  function addNewCategory() {
    const trimmed = newCatValue.trim()
    if (!trimmed) return
    setExtraCats(prev => [...prev, trimmed])
    setCategory(trimmed)
    setShowNewCat(false)
    setNewCatValue('')
  }

  useEffect(() => {
    if (!confirmDelete) return
    const id = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(id)
  }, [confirmDelete])

  function handleSave() {
    if (!name.trim()) return
    const taskData = {
      id:            task.id || crypto.randomUUID(),
      name:          name.trim(),
      type, category,
      credit:        currentType.hasCredit ? (credit || 0) : null,
      debit:         currentType.hasDebit  ? (debit  || 0) : null,
      affectsStreak: currentType.affectsStreak,
      active,
    }
    setVisible(false)
    setTimeout(() => onSave(taskData), 320)
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setVisible(false)
    setTimeout(() => onDelete(task.id), 320)
  }

  const canSave = name.trim().length > 0

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        transition: 'background 0.3s',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', background: '#fff',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92dvh', overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '4px 20px 14px',
          borderBottom: '1px solid #F0EDE8',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
            {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: '#F5F2ED', color: '#888', cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 0' }}>

          {/* Nome */}
          <label style={labelStyle}>Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: Oração matinal"
            autoFocus
            style={{ ...inputStyle, marginBottom: 22 }}
          />

          {/* Tipo */}
          <label style={labelStyle}>Tipo</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 10, scrollbarWidth: 'none' }}>
            {TASK_TYPES.map(t => {
              const isActive = type === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  title={t.desc}
                  style={{
                    flexShrink: 0, width: 76, padding: '10px 6px 8px',
                    borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${isActive ? t.color : '#E5E7EB'}`,
                    background: isActive ? `${t.color}14` : '#F5F2ED',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, color: isActive ? t.color : '#888' }}>
                    {t.label}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Descrição do tipo */}
          <p style={{
            background: `${currentType.color}0F`,
            border: `1px solid ${currentType.color}30`,
            borderRadius: 10, padding: '8px 12px',
            color: currentType.color, fontSize: 12, fontWeight: 600,
            margin: '0 0 22px',
          }}>
            {currentType.desc}
          </p>

          {/* Categoria */}
          <label style={labelStyle}>Categoria</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: showNewCat ? 10 : 22, scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                  border: `1.5px solid ${category === cat ? '#5C8C3E' : '#E5E7EB'}`,
                  background: category === cat ? 'rgba(92,140,62,0.12)' : '#F5F2ED',
                  color: category === cat ? '#5C8C3E' : '#888',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setShowNewCat(true)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                border: '1.5px dashed #D1D5DB', background: 'transparent',
                color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ＋ Nova
            </button>
          </div>

          {showNewCat && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              <input
                value={newCatValue}
                onChange={e => setNewCatValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNewCategory()}
                placeholder="Nome da categoria"
                autoFocus
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #5C8C3E', background: '#fff', color: '#1A1A1A', fontSize: 14, outline: 'none' }}
              />
              <button
                onClick={addNewCategory}
                style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#5C8C3E', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          )}

          {/* Crédito */}
          {currentType.hasCredit && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Valor crédito (se fizer)</label>
              <div style={{ position: 'relative' }}>
                <span style={prefixStyle('#5C8C3E')}>R$</span>
                <input
                  type="number"
                  value={credit ?? ''}
                  onChange={e => setCredit(Number(e.target.value))}
                  step={0.5} min={0}
                  style={{ ...inputStyle, paddingLeft: 44, color: '#5C8C3E' }}
                />
              </div>
            </div>
          )}

          {/* Débito */}
          {currentType.hasDebit && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Valor débito (se não fizer)</label>
              <div style={{ position: 'relative' }}>
                <span style={prefixStyle('#ef4444')}>R$</span>
                <input
                  type="number"
                  value={debit ?? ''}
                  onChange={e => setDebit(Number(e.target.value))}
                  step={0.5} min={0}
                  style={{ ...inputStyle, paddingLeft: 44, color: '#ef4444' }}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div style={{
            background: '#F5F2ED', borderRadius: 10,
            padding: '10px 14px', marginBottom: 20,
            border: '1px solid #E8E4DE',
          }}>
            <p style={{ color: '#888', fontSize: 13, margin: 0, fontWeight: 600 }}>
              {getPreview(type, credit, debit)}
            </p>
          </div>

          {/* Ativo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <p style={{ margin: 0, color: '#1A1A1A', fontSize: 14, fontWeight: 700 }}>Tarefa ativa</p>
              <p style={{ margin: '2px 0 0', color: '#888', fontSize: 12 }}>Aparece no checklist diário</p>
            </div>
            <button
              onClick={() => setActive(v => !v)}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none',
                background: active ? '#5C8C3E' : '#D1D5DB',
                position: 'relative', cursor: 'pointer',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: active ? 24 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px 36px',
          borderTop: '1px solid #F0EDE8',
          display: 'flex', gap: 10,
        }}>
          {isEditing && (
            <button
              onClick={handleDelete}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                border: `1.5px solid ${confirmDelete ? '#ef4444' : '#E5E7EB'}`,
                background: confirmDelete ? 'rgba(239,68,68,0.08)' : 'transparent',
                color: confirmDelete ? '#ef4444' : '#888',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {confirmDelete ? 'Confirmar?' : '🗑 Excluir'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: isEditing ? 2 : 1, height: 48, borderRadius: 12, border: 'none',
              background: canSave ? '#5C8C3E' : '#E5E7EB',
              color: canSave ? '#fff' : '#888',
              fontWeight: 800, fontSize: 15,
              cursor: canSave ? 'pointer' : 'not-allowed',
              boxShadow: canSave ? '0 4px 16px rgba(92,140,62,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isEditing ? 'Salvar' : '+ Criar tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Estilos compartilhados ────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  color: '#888', fontSize: 12, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 8,
}

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: '1.5px solid #E5E7EB', background: '#F5F2ED',
  color: '#1A1A1A', fontSize: 15, fontWeight: 600,
  outline: 'none', boxSizing: 'border-box',
}

function prefixStyle(color) {
  return {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    color, fontWeight: 700, fontSize: 15,
    pointerEvents: 'none',
  }
}
