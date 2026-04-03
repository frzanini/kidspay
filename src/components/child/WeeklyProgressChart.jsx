const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function fmt(v) {
  if (!v && v !== 0) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function WeeklyProgressChart({ dailyBalances, weekBalance, todayIndex, perfectInPlay }) {
  const maxAbs = Math.max(...dailyBalances.map(Math.abs), 0.01)

  return (
    <div style={{
      background: '#fff',
      margin: '0 16px 16px',
      borderRadius: 20,
      padding: '18px 20px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
      }}>
        <div>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 800,
            color: '#1A1A1A', letterSpacing: '-0.01em',
          }}>
            Progresso Semanal
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B8B4AE', fontWeight: 700 }}>
            {fmt(weekBalance)} esta semana
          </p>
        </div>
        {perfectInPlay && (
          <span style={{
            background: 'rgba(217,119,6,0.10)',
            border: '1px solid rgba(217,119,6,0.25)',
            color: '#B45309', fontSize: 10, fontWeight: 800,
            padding: '4px 10px', borderRadius: 999,
            letterSpacing: '0.03em',
          }}>
            ⭐ Semana perfeita!
          </span>
        )}
      </div>

      {/* Barras — com animation-delay escalonado */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: 5, height: 72,
      }}>
        {dailyBalances.map((val, i) => {
          const isToday   = i === todayIndex
          const isFuture  = i > todayIndex
          const isPast    = i < todayIndex
          const heightPct = Math.max((Math.abs(val) / maxAbs) * 100, val !== 0 ? 6 : 0)
          const isNeg     = val < 0

          let barColor
          if (isNeg)         barColor = '#FCA5A5'
          else if (isFuture) barColor = '#E8E4DE'
          else if (isToday)  barColor = 'linear-gradient(180deg, #7AB355, #5C8C3E)'
          else                barColor = '#A8CF80'  // past days — verde mais claro

          return (
            <div
              key={i}
              style={{
                flex: 1, display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                gap: 5, height: '100%', justifyContent: 'flex-end',
              }}
            >
              <div
                className="kp-bar"
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: val !== 0 ? 5 : 0,
                  borderRadius: '6px 6px 4px 4px',
                  background: barColor,
                  animationDelay: `${i * 60}ms`,
                  boxShadow: isToday
                    ? '0 4px 12px rgba(92,140,62,0.35)'
                    : isNeg
                      ? '0 2px 6px rgba(239,68,68,0.2)'
                      : 'none',
                  transformOrigin: 'bottom',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: i === todayIndex ? 900 : 700,
              color: i === todayIndex ? '#5C8C3E' : '#C4C0BA',
              letterSpacing: '0.02em',
            }}>
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
