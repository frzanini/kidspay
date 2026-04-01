import { TASK_TEMPLATES } from '../../data/samuel-template'

export default function TemplateStep({ templateChoice, setTemplateChoice }) {
  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 3 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Como comecar?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
        Escolha um grupo pronto. Depois o pai pode customizar tudo.
      </p>

      {TASK_TEMPLATES.map(template => {
        const selected = templateChoice === template.id
        const accentSoft = `${template.accent}22`

        return (
          <button
            key={template.id}
            onClick={() => setTemplateChoice(template.id)}
            style={{
              width: '100%',
              padding: '22px 20px',
              marginBottom: 14,
              borderRadius: 20,
              border: `2px solid ${selected ? template.accent : '#1e293b'}`,
              background: selected
                ? `linear-gradient(135deg, ${template.accent}33 0%, ${template.accent}14 100%)`
                : '#1e293b',
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: selected ? `0 8px 28px ${template.accent}33` : 'none',
              transform: selected ? 'scale(1.01)' : 'scale(1)',
              transition: 'all 0.2s',
            }}
          >
            {template.id === 'samuel' && (
              <span style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#f59e0b',
                color: '#1c1917',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Recomendado
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: selected ? accentSoft : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
              }}>
                {template.icon}
              </div>
              <div>
                <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
                  {template.name}
                </p>
                <p style={{ color: selected ? '#e2e8f0' : '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                  {template.description}
                </p>
              </div>
            </div>

            <p style={{ color: selected ? '#cbd5e1' : '#94a3b8', fontSize: 13, margin: '0 0 14px', lineHeight: 1.4 }}>
              {template.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {template.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: selected ? accentSoft : '#0f172a',
                    color: selected ? '#f8fafc' : '#475569',
                    border: selected ? `1px solid ${template.accent}55` : '1px solid transparent',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        )
      })}

      <button
        onClick={() => setTemplateChoice('zero')}
        style={{
          width: '100%',
          padding: '22px 20px',
          borderRadius: 20,
          border: `2px solid ${templateChoice === 'zero' ? '#3b82f6' : '#1e293b'}`,
          background: templateChoice === 'zero'
            ? 'rgba(59,130,246,0.07)'
            : '#1e293b',
          textAlign: 'left',
          cursor: 'pointer',
          boxShadow: templateChoice === 'zero' ? '0 8px 28px rgba(59,130,246,0.15)' : 'none',
          transform: templateChoice === 'zero' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>✏️</div>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
          Comecar do zero
        </p>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Nenhuma tarefa pre-cadastrada. O pai monta tudo manualmente depois.
        </p>
      </button>
    </div>
  )
}
