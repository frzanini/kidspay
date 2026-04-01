import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDB } from '../lib/db'
import { samuelTemplate } from '../data/samuel-template'

const AVATARS = [
  { emoji: '🦁', label: 'Leão' },
  { emoji: '🦊', label: 'Raposa' },
  { emoji: '🐬', label: 'Golfinho' },
  { emoji: '🦅', label: 'Águia' },
  { emoji: '🐺', label: 'Lobo' },
  { emoji: '🦈', label: 'Tubarão' },
]

function fmt(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

/* ─── Dot step indicator ─────────────────────────── */
function StepDots({ current }) {
  return (
    <div className="flex gap-2 items-center">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className="rounded-full transition-all duration-300"
          style={{
            width:  current === n ? 20 : 8,
            height: 8,
            background: current >= n ? '#10b981' : '#334155',
          }}
        />
      ))}
    </div>
  )
}

/* ─── Main component ─────────────────────────────── */
export default function Onboarding() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step,      setStep]      = useState(1)
  const [dir,       setDir]       = useState('fwd')
  const [saving,    setSaving]    = useState(false)

  const [childName,      setChildName]      = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🦁')
  const [uploadedPhoto,  setUploadedPhoto]  = useState(null)
  const [weeklyGoal,     setWeeklyGoal]     = useState(28)
  const [tithePercent,   setTithePercent]   = useState(10)
  const [templateChoice, setTemplateChoice] = useState(null)

  function goNext() { setDir('fwd'); setStep(s => s + 1) }
  function goBack() { setDir('back'); setStep(s => s - 1) }

  function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setUploadedPhoto(ev.target.result); setSelectedAvatar(null) }
    reader.readAsDataURL(file)
  }

  function selectAvatar(emoji) { setSelectedAvatar(emoji); setUploadedPhoto(null) }

  async function handleFinish() {
    if (!templateChoice) return
    setSaving(true)
    try {
      const db = await getDB()
      await db.put('profile', { childName, photo: uploadedPhoto || selectedAvatar, weeklyGoal, tithePercent }, 'current')
      if (templateChoice === 'samuel') {
        for (const task of samuelTemplate) await db.put('tasks', task)
      }
      navigate('/')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const canNext =
    step === 1 ? childName.trim().length >= 2 :
    step === 2 ? weeklyGoal >= 1 && tithePercent >= 0 && tithePercent <= 100 :
    !!templateChoice

  const animClass = dir === 'fwd'
    ? 'animate-[step-in_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'
    : 'animate-[step-back_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>

      {/* ── Header ─────────────────────────────────── */}
      <header
        style={{
          flexShrink: 0,
          height: 56,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
          KidsPay
        </span>
        <div style={{ position: 'absolute', right: 20 }}>
          <StepDots current={step} />
        </div>
      </header>

      {/* ── Scrollable area (content + nav juntos) ──── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Conteúdo animado */}
        <main
          key={step}
          className={animClass}
          style={{ flex: 1, padding: '28px 20px 0' }}
        >
          {step === 1 && (
            <Step1
              childName={childName}
              setChildName={setChildName}
              selectedAvatar={selectedAvatar}
              uploadedPhoto={uploadedPhoto}
              onSelectAvatar={selectAvatar}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          )}
          {step === 2 && (
            <Step2
              childName={childName}
              weeklyGoal={weeklyGoal}
              setWeeklyGoal={setWeeklyGoal}
              tithePercent={tithePercent}
              setTithePercent={setTithePercent}
            />
          )}
          {step === 3 && (
            <Step3
              templateChoice={templateChoice}
              setTemplateChoice={setTemplateChoice}
            />
          )}
        </main>

        {/* Botões — colados ao fim do conteúdo */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px 20px 32px',
            display: 'flex',
            gap: 12,
          }}
        >
          {step > 1 && (
            <button
              onClick={goBack}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                border: '1.5px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 15,
                fontWeight: 600,
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
              flex: step > 1 ? 2 : 1,
              height: 48,
              borderRadius: 14,
              border: 'none',
              background: canNext && !saving ? '#10b981' : '#1e293b',
              color: canNext && !saving ? '#fff' : '#475569',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              cursor: canNext && !saving ? 'pointer' : 'not-allowed',
              boxShadow: canNext && !saving ? '0 4px 20px rgba(16,185,129,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Salvando…' : step < 3 ? 'Próximo →' : '🚀 Começar!'}
          </button>
        </div>

      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
    </div>
  )
}

/* ─── Step 1 ─────────────────────────────────────── */
function Step1({ childName, setChildName, selectedAvatar, uploadedPhoto, onSelectAvatar, onUploadClick }) {
  const preview = uploadedPhoto || selectedAvatar

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 1 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Quem vai usar o app?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
        Escolha um avatar e coloque o nome do seu filho
      </p>

      {/* Selected avatar — big */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #064e3b, #065f46)',
            border: '2.5px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            overflow: 'hidden',
            boxShadow: '0 0 0 6px rgba(16,185,129,0.12)',
          }}
        >
          {uploadedPhoto
            ? <img src={uploadedPhoto} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : selectedAvatar}
        </div>
      </div>

      {/* Avatar grid 3×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 14 }}>
        {AVATARS.map(({ emoji, label }) => {
          const active = selectedAvatar === emoji && !uploadedPhoto
          return (
            <button
              key={emoji}
              onClick={() => onSelectAvatar(emoji)}
              title={label}
              style={{
                height: 52,
                borderRadius: 14,
                border: active ? '2px solid #10b981' : '2px solid transparent',
                background: active ? 'rgba(16,185,129,0.15)' : '#1e293b',
                fontSize: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                boxShadow: active ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {emoji}
            </button>
          )
        })}
      </div>

      {/* Upload */}
      <button
        onClick={onUploadClick}
        style={{
          width: '100%',
          padding: '10px 0',
          marginBottom: 22,
          borderRadius: 12,
          border: '1.5px dashed #334155',
          background: 'transparent',
          color: '#64748b',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {uploadedPhoto ? '✓ Foto enviada — trocar?' : '📷 Usar foto'}
      </button>

      {/* Name input */}
      <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Nome
      </label>
      <input
        type="text"
        value={childName}
        onChange={e => setChildName(e.target.value)}
        placeholder="ex: Samuel"
        maxLength={30}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 14,
          border: '1.5px solid',
          borderColor: childName.trim().length >= 2 ? '#10b981' : '#334155',
          background: '#1e293b',
          color: '#f1f5f9',
          fontSize: 16,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600,
          outline: 'none',
          boxShadow: childName.trim().length >= 2 ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
          transition: 'all 0.2s',
        }}
      />
      {childName.trim().length > 0 && childName.trim().length < 2 && (
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>Mínimo 2 caracteres</p>
      )}
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────── */
function Step2({ childName, weeklyGoal, setWeeklyGoal, tithePercent, setTithePercent }) {
  const titheAmt = weeklyGoal * tithePercent / 100
  const net      = weeklyGoal - titheAmt

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 2 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Quanto o {childName || 'seu filho'} pode ganhar?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
        Se completar todas as tarefas da semana
      </p>

      {/* Meta — big value */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Meta semanal
          </span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
            {fmt(weeklyGoal)}
          </span>
        </div>
        <RangeSlider
          value={weeklyGoal} min={5} max={100} step={0.5}
          onChange={e => setWeeklyGoal(Number(e.target.value))}
          color="#10b981" glow="rgba(16,185,129,0.2)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, marginTop: 6 }}>
          <span>R$ 5</span><span>R$ 100</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#1e293b', margin: '0 0 28px' }} />

      {/* Dízimo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Dízimo / poupança
          </span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, fontWeight: 700, color: '#3b82f6', lineHeight: 1 }}>
            {tithePercent}%
          </span>
        </div>
        <RangeSlider
          value={tithePercent} min={0} max={30} step={1}
          onChange={e => setTithePercent(Number(e.target.value))}
          color="#3b82f6" glow="rgba(59,130,246,0.2)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, marginTop: 6 }}>
          <span>0%</span><span>30%</span>
        </div>
      </div>

      {/* Inline preview */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: '16px 18px',
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Meta bruta</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{fmt(weeklyGoal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Dízimo ({tithePercent}%)</span>
          <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 14 }}>− {fmt(titheAmt)}</span>
        </div>
        <div style={{ borderTop: '1px solid #334155', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recebe até
          </span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#10b981' }}>
            {fmt(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3 ─────────────────────────────────────── */
function Step3({ templateChoice, setTemplateChoice }) {
  const tagsSamuel = ['Oração', 'Exercício', 'Lição', 'Leitura', 'Respeito', '+7']

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 3 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Como começar?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
        Você pode editar qualquer tarefa depois
      </p>

      {/* Samuel card */}
      <button
        onClick={() => setTemplateChoice('samuel')}
        style={{
          width: '100%',
          padding: '22px 20px',
          marginBottom: 14,
          borderRadius: 20,
          border: `2px solid ${templateChoice === 'samuel' ? '#10b981' : '#1e293b'}`,
          background: templateChoice === 'samuel'
            ? 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)'
            : '#1e293b',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: templateChoice === 'samuel' ? '0 8px 28px rgba(16,185,129,0.22)' : 'none',
          transform: templateChoice === 'samuel' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s',
        }}
      >
        {/* Badge */}
        <span style={{
          position: 'absolute', top: 16, right: 16,
          background: '#f59e0b', color: '#1c1917',
          fontSize: 11, fontWeight: 800,
          padding: '3px 9px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Recomendado
        </span>

        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
          Modelo Samuel
        </p>
        <p style={{ color: templateChoice === 'samuel' ? '#6ee7b7' : '#64748b', fontSize: 14, lineHeight: 1.5, margin: '0 0 14px' }}>
          12 tarefas prontas em 5 categorias da vida
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tagsSamuel.map(t => (
            <span
              key={t}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 20,
                background: templateChoice === 'samuel' ? 'rgba(16,185,129,0.18)' : '#0f172a',
                color: templateChoice === 'samuel' ? '#6ee7b7' : '#475569',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </button>

      {/* Zero card */}
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
          Começar do zero
        </p>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Crie suas próprias tarefas do jeito que preferir
        </p>
      </button>
    </div>
  )
}
