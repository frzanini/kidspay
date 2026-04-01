import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDB } from '../lib/db'
import { getTaskTemplate } from '../data/samuel-template'
import TemplateStep from '../components/onboarding/TemplateStep'

const AVATARS = [
  { emoji: '🦁', label: 'Leao' },
  { emoji: '🦊', label: 'Raposa' },
  { emoji: '🐬', label: 'Golfinho' },
  { emoji: '🦅', label: 'Aguia' },
  { emoji: '🐺', label: 'Lobo' },
  { emoji: '🦈', label: 'Tubarao' },
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

function StepDots({ current }) {
  return (
    <div className="flex gap-2 items-center">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className="rounded-full transition-all duration-300"
          style={{
            width: current === n ? 20 : 8,
            height: 8,
            background: current >= n ? '#10b981' : '#334155',
          }}
        />
      ))}
    </div>
  )
}

function DeductionControl({ label, enabled, onToggle, percent, onChange, accent, glow }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          style={{
            minWidth: 96,
            height: 34,
            borderRadius: 999,
            border: `1.5px solid ${enabled ? accent : '#334155'}`,
            background: enabled ? `${accent}22` : 'transparent',
            color: enabled ? '#f8fafc' : '#64748b',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {enabled ? `${percent}%` : 'Desligado'}
        </button>
      </div>
      {enabled && (
        <>
          <RangeSlider
            value={percent}
            min={0}
            max={30}
            step={1}
            onChange={e => onChange(Number(e.target.value))}
            color={accent}
            glow={glow}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, marginTop: 6 }}>
            <span>0%</span><span>30%</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [dir, setDir] = useState('fwd')
  const [saving, setSaving] = useState(false)

  const [childName, setChildName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🦁')
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [weeklyGoal, setWeeklyGoal] = useState(28)
  const [titheEnabled, setTitheEnabled] = useState(true)
  const [tithePercent, setTithePercent] = useState(10)
  const [savingsEnabled, setSavingsEnabled] = useState(false)
  const [savingsPercent, setSavingsPercent] = useState(10)
  const [templateChoice, setTemplateChoice] = useState(null)

  function goNext() {
    setDir('fwd')
    setStep(s => s + 1)
  }

  function goBack() {
    setDir('back')
    setStep(s => s - 1)
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setUploadedPhoto(ev.target.result)
      setSelectedAvatar(null)
    }
    reader.readAsDataURL(file)
  }

  function selectAvatar(emoji) {
    setSelectedAvatar(emoji)
    setUploadedPhoto(null)
  }

  async function handleFinish() {
    if (!templateChoice) return
    setSaving(true)
    try {
      const db = await getDB()
      const selectedTemplate = getTaskTemplate(templateChoice)
      await db.put(
        'profile',
        {
          childName,
          photo: uploadedPhoto || selectedAvatar,
          weeklyGoal,
          titheEnabled,
          tithePercent,
          savingsEnabled,
          savingsPercent,
          templateId: selectedTemplate?.id || null,
          templateName: selectedTemplate?.name || null,
        },
        'current',
      )
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
    step === 2 ? weeklyGoal >= 1 && tithePercent >= 0 && tithePercent <= 100 && savingsPercent >= 0 && savingsPercent <= 100 :
    !!templateChoice

  const animClass = dir === 'fwd'
    ? 'animate-[step-in_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'
    : 'animate-[step-back_0.32s_cubic-bezier(0.22,1,0.36,1)_both]'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
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

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
              weeklyGoal={weeklyGoal}
              setWeeklyGoal={setWeeklyGoal}
              titheEnabled={titheEnabled}
              setTitheEnabled={setTitheEnabled}
              tithePercent={tithePercent}
              setTithePercent={setTithePercent}
              savingsEnabled={savingsEnabled}
              setSavingsEnabled={setSavingsEnabled}
              savingsPercent={savingsPercent}
              setSavingsPercent={setSavingsPercent}
            />
          )}
          {step === 3 && (
            <TemplateStep
              templateChoice={templateChoice}
              setTemplateChoice={setTemplateChoice}
            />
          )}
        </main>

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
            {saving ? 'Salvando...' : step < 3 ? 'Proximo →' : 'Comecar!'}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
    </div>
  )
}

function Step1({ childName, setChildName, selectedAvatar, uploadedPhoto, onSelectAvatar, onUploadClick }) {
  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 1 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Configure o perfil do seu filho
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
        O responsavel comeca por aqui e deixa tudo pronto para a crianca
      </p>

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
        {uploadedPhoto ? 'Foto enviada - trocar?' : 'Usar foto'}
      </button>

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
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>Minimo 2 caracteres</p>
      )}
    </div>
  )
}

function Step2({
  weeklyGoal,
  setWeeklyGoal,
  titheEnabled,
  setTitheEnabled,
  tithePercent,
  setTithePercent,
  savingsEnabled,
  setSavingsEnabled,
  savingsPercent,
  setSavingsPercent,
}) {
  const titheAmt = titheEnabled ? weeklyGoal * tithePercent / 100 : 0
  const savingsAmt = savingsEnabled ? weeklyGoal * savingsPercent / 100 : 0
  const net = weeklyGoal - titheAmt - savingsAmt

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
        Passo 2 de 3
      </p>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2, textAlign: 'center' }}>
        Defina os combinados da semana
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
        O pai configura meta, dizimo e poupanca antes de liberar o uso
      </p>

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
          value={weeklyGoal}
          min={5}
          max={100}
          step={0.5}
          onChange={e => setWeeklyGoal(Number(e.target.value))}
          color="#10b981"
          glow="rgba(16,185,129,0.2)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, marginTop: 6 }}>
          <span>R$ 5</span><span>R$ 100</span>
        </div>
      </div>

      <div style={{ height: 1, background: '#1e293b', margin: '0 0 28px' }} />

      <DeductionControl
        label="Dizimo"
        enabled={titheEnabled}
        onToggle={() => setTitheEnabled(value => !value)}
        percent={tithePercent}
        onChange={setTithePercent}
        accent="#3b82f6"
        glow="rgba(59,130,246,0.2)"
      />

      <DeductionControl
        label="Poupanca"
        enabled={savingsEnabled}
        onToggle={() => setSavingsEnabled(value => !value)}
        percent={savingsPercent}
        onChange={setSavingsPercent}
        accent="#f59e0b"
        glow="rgba(245,158,11,0.2)"
      />

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
          <span style={{ color: '#64748b', fontSize: 14 }}>Dizimo</span>
          <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 14 }}>- {fmt(titheAmt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Poupanca</span>
          <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 14 }}>- {fmt(savingsAmt)}</span>
        </div>
        <div style={{ borderTop: '1px solid #334155', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recebe ate
          </span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#10b981' }}>
            {fmt(net)}
          </span>
        </div>
      </div>
    </div>
  )
}
