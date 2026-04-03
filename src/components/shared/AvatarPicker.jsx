import { AVATAR_LIST } from '../../lib/avatarAssets'

export default function AvatarPicker({ value, onChange }) {
  return (
    <div>
      <p style={{
        margin: '0 0 14px',
        fontSize: 13, fontWeight: 700, color: '#888',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Escolha o avatar
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        justifyItems: 'center',
      }}>
        {AVATAR_LIST.map(({ key, src, label }) => {
          const active = value === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              title={label}
              style={{
                padding: 4,
                borderRadius: '50%',
                border: `3px solid ${active ? '#5C8C3E' : 'transparent'}`,
                boxShadow: active ? '0 0 0 4px rgba(92,140,62,0.2)' : 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
              }}
            >
              <img
                src={src}
                alt={label}
                style={{
                  width: 72, height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
