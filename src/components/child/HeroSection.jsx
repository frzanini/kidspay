import paisagem from '../../assets/paisagem.png'
import { resolveAvatar } from '../../lib/avatarAssets'

function fmt(v) {
  if (!v && v !== 0) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function HeroSection({ childName, photo, tasksCompleted, tasksTotal, weekBalance, landscape }) {
  const avatarSrc = resolveAvatar(photo)
  const allDone   = tasksTotal > 0 && tasksCompleted === tasksTotal

  return (
    <div style={{
      position: 'relative',
      height: landscape ? '100%' : 268,
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* Paisagem */}
      <img
        src={paisagem}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 60%',
        }}
      />

      {/* Overlay multicamada: legibilidade + transição suave para TodayCard */}
      <div style={{
        position: 'absolute', inset: 0,
        background: landscape
          ? `linear-gradient(90deg,
              rgba(0,0,0,0.10) 0%,
              rgba(0,0,0,0.04) 40%,
              rgba(220,240,205,0.60) 75%,
              rgba(220,240,205,0.96) 100%
            )`
          : `linear-gradient(180deg,
              rgba(0,0,0,0.22) 0%,
              rgba(0,0,0,0.06) 38%,
              rgba(220,240,205,0.35) 62%,
              rgba(220,240,205,0.78) 82%,
              rgba(220,240,205,0.96) 100%
            )`,
      }} />

      {/* Nome — topo esquerdo */}
      <p style={{
        position: 'absolute', top: 18, left: 20,
        margin: 0, color: '#fff',
        fontSize: 15, fontWeight: 800,
        textShadow: '0 1px 6px rgba(0,0,0,0.4)',
        letterSpacing: '0.01em',
      }}>
        {childName || 'Olá!'}
      </p>

      {/* Badge progresso — topo direito (glass morphism) */}
      <div style={{
        position: 'absolute', top: 14, right: 16,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 999, padding: '5px 13px',
        display: 'flex', alignItems: 'center', gap: 5,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
        border: '1px solid rgba(255,255,255,0.5)',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: allDone ? '#5C8C3E' : '#5C8C3E',
        }}>
          {allDone ? '🌟' : '✓'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>
          {tasksCompleted} / {tasksTotal}
        </span>
      </div>

      {/* Avatar — centralizado, flutuante, com anel */}
      <div style={{
        position: 'absolute',
        left: '10%', top: '10%',
        transform: 'translate(-50%, -50%)',
        animation: 'float 3.5s ease-in-out infinite',
      }}>
        <div style={{
          borderRadius: '50%',
          animation: allDone ? 'pulse-ring 2s ease-out infinite' : 'none',
        }}>
          <img
            src={avatarSrc}
            alt={childName}
            style={{
              width: 350, height: 350,
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block'
              //filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.22))',
            }}
          />
        </div>
      </div>

      {/* Saldo — inferior, usando Fraunces para destaque */}
      <div style={{
        position: 'absolute', bottom: 100, left: 0, right: 0,
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 40, fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: '#fff',
          textShadow: '0 2px 12px rgba(0,0,0,0.28)',
        }}>
          {fmt(weekBalance)}
        </p>
        <p style={{
          margin: '4px 0 0', color: 'rgba(255,255,255,0.82)',
          fontSize: 16, fontWeight: 700, letterSpacing: '0.04em',
          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}>
          💰 acumulado esta semana
        </p>
      </div>
    </div>
  )
}
