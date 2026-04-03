import { useState } from 'react'

function fmt(v) {
  if (!v && v !== 0) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TaskCard({ task, checked, onToggle, index = 0 }) {
  const [showCoin,  setShowCoin]  = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const isPenalty  = task.type === 'so_penalidade'
  const isSymbolic = task.type === 'simbolico'

  const coinValue = isPenalty
    ? (task.debit  ? `−${fmt(task.debit)}`  : null)
    : (task.credit ? `+${fmt(task.credit)}` : null)

  function handleTap() {
    const willCheck = !checked
    if (willCheck && coinValue && !isSymbolic) {
      setShowCoin(true)
      setTimeout(() => setShowCoin(false), 900)
    }
    onToggle(task.id)
  }

  // Cores e sombras por estado
  const pendingBg = index % 2 === 0 ? '#E8A020' : '#F5C040'
  const bg        = checked ? '#9A6010' : pendingBg
  const shadow    = checked
    ? '0 2px 8px rgba(154,96,16,0.32), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 4px 16px rgba(232,160,32,0.40), inset 0 1px 0 rgba(255,255,255,0.24)'

  return (
    <div
      className="kp-task-card"
      onClick={handleTap}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px',
        background: bg,
        borderRadius: 18,
        marginBottom: 10,
        cursor: 'pointer', userSelect: 'none',
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        boxShadow: shadow,
        position: 'relative',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        borderRadius: 8,
        border: `2.5px solid ${checked ? '#5C8C3E' : 'rgba(255,255,255,0.65)'}`,
        background: checked
          ? 'linear-gradient(135deg, #7AB355, #5C8C3E)'
          : 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: '#fff', fontWeight: 900,
        transition: 'all 0.2s var(--ease-back, cubic-bezier(0.34,1.56,0.64,1))',
        animation: showCoin ? 'check-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        boxShadow: checked ? '0 2px 6px rgba(92,140,62,0.4)' : 'none',
      }}>
        {checked && '✓'}
      </div>

      {/* Nome + hint */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700,
          color: checked ? 'rgba(255,255,255,0.78)' : '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          textDecoration: checked && !isPenalty ? 'line-through' : 'none',
          textDecorationColor: 'rgba(255,255,255,0.4)',
          transition: 'color 0.2s, text-decoration 0.2s',
        }}>
          {task.name}
        </p>
        {isPenalty && !checked && (
          <p style={{
            margin: '2px 0 0', fontSize: 11,
            color: 'rgba(255,255,255,0.7)', fontWeight: 700,
            letterSpacing: '0.02em',
          }}>
            marque se não fez
          </p>
        )}
        {isSymbolic && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
            simbólico
          </p>
        )}
      </div>

      {/* Badge de valor */}
      {coinValue && (
        <div style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 999, padding: '4px 11px',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 800,
            color: isPenalty ? '#ef4444' : '#5C8C3E',
            letterSpacing: '-0.01em',
          }}>
            {coinValue}
          </span>
        </div>
      )}

      {/* Animação coin-fly */}
      {showCoin && coinValue && (
        <span style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 14, fontWeight: 900, color: '#fff',
          animation: 'coin-fly 0.9s ease-out forwards',
          pointerEvents: 'none', whiteSpace: 'nowrap',
          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}>
          {coinValue}
        </span>
      )}
    </div>
  )
}
