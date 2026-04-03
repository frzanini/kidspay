import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const ITEMS = [
  { key: 'home',    label: 'Hoje',       icon: HomeIcon },
  { key: 'metas',   label: 'Metas',      icon: TargetIcon },
  { key: 'notif',   label: 'Avisos',     icon: BellIcon,    inactive: true },
  { key: 'hist',    label: 'Histórico',  icon: CalendarIcon },
  { key: 'mais',    label: 'Mais',       icon: GridIcon },
]

export default function BottomNav({ activeTab, onTabChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isParent = location.pathname === '/parents'
  const [showMaisMenu, setShowMaisMenu] = useState(false)

  function handlePress(key) {
    if (key === 'mais') {
      setShowMaisMenu(v => !v)
      return
    }
    setShowMaisMenu(false)
    if (key === 'hist') {
      navigate('/parents')
      return
    }
    if (key === 'home') {
      if (isParent) navigate('/')
      onTabChange?.('habitos')
      return
    }
    if (key === 'metas') {
      if (isParent) navigate('/')
      onTabChange?.('metas')
      return
    }
  }

  function getActive(key) {
    if (key === 'hist') return isParent
    if (key === 'home') return !isParent && activeTab === 'habitos'
    if (key === 'metas') return !isParent && activeTab === 'metas'
    return false
  }

  return (
    <>
      {/* Menu "Mais" */}
      {showMaisMenu && (
        <>
          <div
            onClick={() => setShowMaisMenu(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 39,
            }}
          />
          <div style={{
            position: 'fixed', bottom: 76, right: 16, zIndex: 40,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            overflow: 'hidden', minWidth: 180,
          }}>
            <button
              onClick={() => {
                setShowMaisMenu(false)
                navigate(isParent ? '/' : '/parents')
              }}
              style={{
                width: '100%', padding: '14px 18px',
                background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#1A1A1A',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>{isParent ? '👧' : '👨‍👩‍👧'}</span>
              {isParent ? 'Modo filho' : 'Modo pais'}
            </button>
          </div>
        </>
      )}

      {/* Barra de navegação */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: '#fff',
        borderTop: '1px solid #F0EDE8',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {ITEMS.map(({ key, label, icon: Icon, inactive }) => {
          const active = getActive(key)
          return (
            <button
              key={key}
              onClick={() => !inactive && handlePress(key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '10px 0 8px',
                background: 'none', border: 'none',
                cursor: inactive ? 'default' : 'pointer',
                opacity: inactive ? 0.35 : 1,
                position: 'relative',
              }}
            >
              {/* Pill de fundo no item ativo */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 6, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40, height: 28,
                  borderRadius: 999,
                  background: 'rgba(92,140,62,0.10)',
                }} />
              )}
              <Icon color={active ? '#5C8C3E' : '#B8B4AE'} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: active ? '#5C8C3E' : '#B8B4AE',
                letterSpacing: '0.01em',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ── Ícones SVG inline ── */
function HomeIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  )
}

function BellIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 17H5a1 1 0 01-.8-1.6L6 13V10a6 6 0 1112 0v3l1.8 2.4A1 1 0 0119 17h-4z"
        stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
    </svg>
  )
}
