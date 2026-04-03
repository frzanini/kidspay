import TaskCard from './TaskCard'

const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function filterByTab(tasks, tab) {
  if (tab === 'metas') return tasks.filter(t => t.type === 'so_credito')
  return tasks.filter(t => t.type !== 'so_credito')
}

export default function TodayCard({
  tasks, isChecked, onToggle,
  dayIndex, activeTab, onTabChange,
  todayCompleted, isWeekend, landscape,
}) {
  const visibleTasks = filterByTab(tasks, activeTab)
  const isWorkday    = dayIndex < 5
  const pct          = tasks.length > 0 ? Math.round((todayCompleted / tasks.length) * 100) : 0

  return (
    <div
      className="kp-slide-up"
      style={{
        background: '#EEF6E8',
        borderRadius: landscape ? '20px 0 0 0' : '28px 28px 0 0',
        boxShadow: landscape
          ? 'inset 4px 0 20px rgba(0,0,0,0.05)'
          : '0 -6px 32px rgba(0,0,0,0.09)',
        marginTop: landscape ? 0 : -28,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle — pill verde, só em portrait */}
      {!landscape && (
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'linear-gradient(90deg, #7AB355, #5C8C3E)',
          margin: '14px auto 0',
          flexShrink: 0,
          opacity: 0.6,
        }} />
      )}

      {/* Cabeçalho com micro progresso */}
      <div style={{
        padding: '14px 20px 0',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <p style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            color: '#1A1A1A', letterSpacing: '-0.02em',
          }}>
            Hoje
          </p>
          {isWorkday && (
            <p style={{ margin: '1px 0 0', fontSize: 12, color: '#B8B4AE', fontWeight: 700, letterSpacing: '0.02em' }}>
              {DAY_NAMES[dayIndex]}
            </p>
          )}
        </div>

        {/* Progresso circular-ish com texto */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: pct === 100 ? 'rgba(92,140,62,0.12)' : '#F5F2ED',
            borderRadius: 999, padding: '5px 12px',
            border: pct === 100 ? '1px solid rgba(92,140,62,0.25)' : 'none',
            transition: 'all 0.3s ease',
          }}>
            {pct === 100 && <span style={{ fontSize: 12 }}>🌟</span>}
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: pct === 100 ? '#5C8C3E' : '#B8B4AE',
              letterSpacing: '0.01em',
            }}>
              {todayCompleted}/{tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs — com transição suave */}
      <div style={{
        display: 'flex', gap: 6,
        padding: '14px 20px 0',
        flexShrink: 0,
      }}>
        {[
          { key: 'habitos', label: 'Hábitos Diários' },
          { key: 'metas',   label: 'Metas' },
        ].map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 999, border: 'none',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                transition: `
                  background var(--dur-base, 220ms) var(--ease-spring, cubic-bezier(0.22,1,0.36,1)),
                  color var(--dur-base, 220ms) ease,
                  box-shadow var(--dur-base, 220ms) ease
                `,
                background: isActive
                  ? 'linear-gradient(135deg, #7AB355, #5C8C3E)'
                  : '#F5F2ED',
                color:     isActive ? '#fff' : '#B8B4AE',
                boxShadow: isActive ? '0 4px 12px rgba(92,140,62,0.3)' : 'none',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 120px' }}>
        {isWeekend ? (
          <EmptyState emoji="🎉" title="Bom fim de semana!" text="Hoje não há tarefas. Aproveite e descanse!" />
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            emoji={activeTab === 'metas' ? '🎯' : '📋'}
            title={activeTab === 'metas' ? 'Sem metas ainda' : 'Sem tarefas ainda'}
            text={activeTab === 'metas'
              ? 'Peça para seus pais adicionarem metas bônus!'
              : 'Peça para seus pais configurarem as tarefas!'}
          />
        ) : (
          visibleTasks.map((task, idx) => (
            <TaskCard
              key={task.id}
              task={task}
              index={idx}
              checked={isChecked(task.id)}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyState({ emoji, title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>{emoji}</div>
      <p style={{
        fontSize: 18, fontWeight: 800, color: '#1A1A1A',
        margin: '0 0 6px', letterSpacing: '-0.01em',
      }}>
        {title}
      </p>
      <p style={{ fontSize: 14, color: '#B8B4AE', margin: 0, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  )
}
