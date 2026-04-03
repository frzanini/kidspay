import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDB } from '../lib/db'
import { getTaskTemplate } from '../data/samuel-template'
import TemplateStep from '../components/onboarding/TemplateStep'
import AvatarPicker from '../components/shared/AvatarPicker'
import { resolveAvatar } from '../lib/avatarAssets'

function RangeSlider({ value, min, max, step, onChange, color, glow }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      className="kp-slider"
      style={{ '--fill': `${pct}%`, '--clr': color, '--glow': glow }}
    />
  )
}

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3].map(n => (
        <div
          key={n}
          style={{
            height: 8,
            width: current === n ? 24 : 8,
            borderRadius: 999,
            background: current >= n ? '#5C8C3E' : '#D1D5DB',
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  )
}

function DeductionControl({ label, enabled, onToggle, percent, onChange, accent, glow }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700 }}>
          {label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          style={{
            minWidth: 96, height: 34, borderRadius: 999,
            border: `1.5px solid ${enabled ? accent : '#D1D5DB'}`,
            background: enabled ? `${accent}18` : 'transparent',
            color: enabled ? accent : '#888',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {enabled ? `${percent}%` : 'Desligado'}
        </button>
      </div>
      {enabled && (
        <>
          <RangeSlider
            value={percent}
            min={0} max={30} step={1}
            onChange={e => onChange(Number(e.target.value))}
            color={accent} glow={glow}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12, marginTop: 6 }}>
            <span>0%</span><span>30%</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()

  const [step,           setStep]           = useState(1)
  const [dir,            setDir]            = useState('fwd')
  const [saving,         setSaving]         = useState(false)
  const [childName,      setChildName]      = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('garota1.png')
  const [weeklyGoal,     setWeeklyGoal]     = useState(28)
  const [titheEnabled,   setTitheEnabled]   = useState(true)
  const [tithePercent,   setTithePercent]   = useState(10)
  const [savingsEnabled, setSavingsEnabled] = useState(false)
  const [savingsPercent, setSavingsPercent] = useState(10)
  const [templateChoice, setTemplateChoice] = useState(null)

  function goNext()  { setDir('fwd');  setStep(s => s + 1) }
  function goBack()  { setDir('back'); setStep(s => s - 1) }

  async function handleFinish() {
    if (!templateChoice) return
    setSaving(true)
    try {
      const db = await getDB()
      const selectedTemplate = getTaskTemplate(templateChoice)
      await db.put('profile', {
        childName,
        photo: selectedAvatar,
        weeklyGoal,
        titheEnabled, tithePercent,
        savingsEnabled, savingsPercent,
        templateId:   selectedTemplate?.id   || null,
        templateName: selectedTemplate?.name || null,
      }, 'current')
      if (selectedTemplate) {
        for (const task of selectedTemplate.tasks) await db.put('tasks', task)
      }
      navigate(selectedTemplate ? '/' : '/parents')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const canNext =
    step === 1 ? childName.trim().length >= 2 :
    step === 2 ? weeklyGoal >= 1 :
    !!templateChoice

  const animClass = dir === 'fwd'
    ? 'animate-[step-in_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'
    : 'animate-[step-back_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F5F2ED' }}>

      {/* Header */}
      <header style={{
        flexShrink: 0, height: 56, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#5C8C3E' }}>
          KidsPay
        </span>
        <StepDots current={step} />
      </header>

      {/* Conteúdo do step */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <main
          key={step}
          className={animClass}
          style={{ flex: 1, padding: '24px 20px 0' }}
        >
          {step === 1 && (
            <Step1
              childName={childName}
              setChildName={setChildName}
              selectedAvatar={selectedAvatar}
              onSelectAvatar={setSelectedAvatar}
            />
          )}
          {step === 2 && (
            <Step2
              weeklyGoal={weeklyGoal}       setWeeklyGoal={setWeeklyGoal}
              titheEnabled={titheEnabled}   setTitheEnabled={setTitheEnabled}
              tithePercent={tithePercent}   setTithePercent={setTithePercent}
              savingsEnabled={savingsEnabled} setSavingsEnabled={setSavingsEnabled}
              savingsPercent={savingsPercent} setSavingsPercent={setSavingsPercent}
            />
          )}
          {step === 3 && (
            <TemplateStep
              templateChoice={templateChoice}
              setTemplateChoice={setTemplateChoice}
            />
          )}
        </main>

        {/* Botões */}
        <div style={{ flexShrink: 0, padding: '20px 20px 36px', display: 'flex', gap: 12 }}>
          {step > 1 && (
            <button
              onClick={goBack}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                border: 'none', background: '#E8E4DE',
                color: '#888', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={step < 3 ? goNext : handleFinish}
            disabled={!canNext || saving}
            style={{
              flex: step > 1 ? 2 : 1, height: 52, borderRadius: 14,
              border: 'none',
              background: canNext && !saving ? '#5C8C3E' : '#D1D5DB',
              color: canNext && !saving ? '#fff' : '#888',
              fontSize: 15, fontWeight: 800,
              cursor: canNext && !saving ? 'pointer' : 'not-allowed',
              boxShadow: canNext && !saving ? '0 4px 20px rgba(92,140,62,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Salvando...' : step < 3 ? 'Próximo →' : 'Começar!'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Passo 1: Nome e avatar ─────────────────────────────────────────────────

function Step1({ childName, setChildName, selectedAvatar, onSelectAvatar }) {
  const avatarSrc = resolveAvatar(selectedAvatar)

  return (
    <div>
      <p style={{ color: '#888', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 1 de 3
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Configure o perfil
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
        O responsável começa por aqui
      </p>

      {/* Preview do avatar selecionado */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <img
          src={avatarSrc}
          alt="avatar"
          style={{
            width: 100, height: 100, borderRadius: '50%',
            objectFit: 'cover',
            border: '4px solid #5C8C3E',
            boxShadow: '0 0 0 6px rgba(92,140,62,0.15)',
          }}
        />
      </div>

      {/* Seletor de avatar */}
      <div style={{
        background: '#fff', borderRadius: 20,
        padding: '20px', marginBottom: 20,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <AvatarPicker value={selectedAvatar} onChange={onSelectAvatar} />
      </div>

      {/* Nome */}
      <label style={{ display: 'block', color: '#888', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Nome da criança
      </label>
      <input
        type="text"
        value={childName}
        onChange={e => setChildName(e.target.value)}
        placeholder="ex: Samuel"
        maxLength={30}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          border: `1.5px solid ${childName.trim().length >= 2 ? '#5C8C3E' : '#D1D5DB'}`,
          background: '#fff', color: '#1A1A1A', fontSize: 16, fontWeight: 600,
          outline: 'none', boxSizing: 'border-box',
          boxShadow: childName.trim().length >= 2 ? '0 0 0 3px rgba(92,140,62,0.12)' : 'none',
          transition: 'all 0.2s',
        }}
      />
      {childName.trim().length > 0 && childName.trim().length < 2 && (
        <p style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>Mínimo 2 caracteres</p>
      )}
    </div>
  )
}

// ── Passo 2: Configurações financeiras ────────────────────────────────────

function Step2({
  weeklyGoal, setWeeklyGoal,
  titheEnabled, setTitheEnabled, tithePercent, setTithePercent,
  savingsEnabled, setSavingsEnabled, savingsPercent, setSavingsPercent,
}) {
  function fmt(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const titheAmt   = titheEnabled   ? weeklyGoal * tithePercent   / 100 : 0
  const savingsAmt = savingsEnabled ? weeklyGoal * savingsPercent / 100 : 0
  const net        = weeklyGoal - titheAmt - savingsAmt

  return (
    <div>
      <p style={{ color: '#888', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 2 de 3
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Combinados da semana
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
        Meta, dízimo e poupança
      </p>

      <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {/* Meta semanal */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700 }}>Meta semanal</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#5C8C3E' }}>{fmt(weeklyGoal)}</span>
          </div>
          <RangeSlider
            value={weeklyGoal} min={5} max={100} step={0.5}
            onChange={e => setWeeklyGoal(Number(e.target.value))}
            color="#5C8C3E" glow="rgba(92,140,62,0.2)"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12, marginTop: 6 }}>
            <span>R$ 5</span><span>R$ 100</span>
          </div>
        </div>

        <div style={{ height: 1, background: '#F0EDE8', margin: '0 0 24px' }} />

        <DeductionControl
          label="Dízimo"
          enabled={titheEnabled} onToggle={() => setTitheEnabled(v => !v)}
          percent={tithePercent} onChange={setTithePercent}
          accent="#3b82f6" glow="rgba(59,130,246,0.2)"
        />
        <DeductionControl
          label="Poupança"
          enabled={savingsEnabled} onToggle={() => setSavingsEnabled(v => !v)}
          percent={savingsPercent} onChange={setSavingsPercent}
          accent="#F59E0B" glow="rgba(245,158,11,0.2)"
        />
      </div>

      {/* Resumo */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {[
          { label: 'Meta bruta', value: fmt(weeklyGoal), color: '#1A1A1A' },
          { label: `Dízimo (${tithePercent}%)`, value: `− ${fmt(titheAmt)}`, color: '#3b82f6', hidden: !titheEnabled },
          { label: `Poupança (${savingsPercent}%)`, value: `− ${fmt(savingsAmt)}`, color: '#F59E0B', hidden: !savingsEnabled },
        ].filter(r => !r.hidden).map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#888', fontSize: 14 }}>{r.label}</span>
            <span style={{ color: r.color, fontWeight: 600, fontSize: 14 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#888', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recebe até
          </span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#5C8C3E' }}>{fmt(net)}</span>
        </div>
      </div>
    </div>
  )
}
