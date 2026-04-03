import { TASK_TEMPLATES } from '../../data/samuel-template'
import { TEMPLATE_ICONS } from '../../lib/icons'

export default function TemplateStep({ templateChoice, setTemplateChoice }) {
  return (
    <div>
      <p style={{ color: '#888', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 3 de 3
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Como começar?
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
        Escolha um modelo pronto. O responsável pode editar tudo depois.
      </p>

      {TASK_TEMPLATES.map(template => {
        const selected = templateChoice === template.id
        return (
          <button
            key={template.id}
            onClick={() => setTemplateChoice(template.id)}
            style={{
              width: '100%', padding: '18px 18px',
              marginBottom: 12, borderRadius: 20,
              border: `2px solid ${selected ? template.accent : '#E8E4DE'}`,
              background: selected
                ? `linear-gradient(135deg, ${template.accent}18 0%, ${template.accent}08 100%)`
                : '#fff',
              textAlign: 'left', cursor: 'pointer',
              position: 'relative',
              boxShadow: selected
                ? `0 8px 24px ${template.accent}22`
                : '0 2px 8px rgba(0,0,0,0.05)',
              transform: selected ? 'scale(1.01)' : 'scale(1)',
              transition: 'all 0.2s',
            }}
          >
            {template.id === 'samuel' && (
              <span style={{
                position: 'absolute', top: 14, right: 14,
                background: '#5C8C3E', color: '#fff',
                fontSize: 10, fontWeight: 800,
                padding: '3px 9px', borderRadius: 999,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Recomendado
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${template.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
              }}>
                {template.icon}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
                  {template.name}
                </p>
                <p style={{ color: '#888', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  {template.description}
                </p>
              </div>
            </div>

            <p style={{ color: '#888', fontSize: 13, margin: '0 0 12px', lineHeight: 1.4 }}>
              {template.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {template.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 999,
                    background: selected ? `${template.accent}18` : '#F5F2ED',
                    color: selected ? template.accent : '#888',
                    border: selected ? `1px solid ${template.accent}44` : '1px solid transparent',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        )
      })}

      {/* Opção: começar do zero */}
      <button
        onClick={() => setTemplateChoice('zero')}
        style={{
          width: '100%', padding: '18px 18px', borderRadius: 20,
          border: `2px solid ${templateChoice === 'zero' ? '#3b82f6' : '#E8E4DE'}`,
          background: templateChoice === 'zero' ? 'rgba(59,130,246,0.06)' : '#fff',
          textAlign: 'left', cursor: 'pointer',
          boxShadow: templateChoice === 'zero'
            ? '0 8px 24px rgba(59,130,246,0.12)'
            : '0 2px 8px rgba(0,0,0,0.05)',
          transform: templateChoice === 'zero' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s',
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>{TEMPLATE_ICONS.custom}</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
          Começar do zero
        </p>
        <p style={{ color: '#888', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          Nenhuma tarefa pré-cadastrada. O responsável monta tudo manualmente.
        </p>
      </button>
    </div>
  )
}
