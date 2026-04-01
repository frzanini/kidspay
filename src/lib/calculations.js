// Bonus por faixa de páginas
export function pagesBonus(pages) {
  if (pages >= 200) return 5.00
  if (pages >= 101) return 3.00
  if (pages >= 51)  return 2.00
  return 1.00
}

// Créditos e débitos de uma lista de entradas do checklist
export function calcWeekSummary(tasks, entries) {
  let credits = 0
  let debits  = 0
  for (const e of entries) {
    if (!e.checked) continue
    const task = tasks.find(t => t.id === e.taskId)
    if (!task) continue
    if (task.type === 'so_penalidade') debits  += (task.debit  || 0)
    else                               credits += (task.credit || 0)
  }
  return { credits, debits, subtotal: credits - debits }
}

// Resultado final: (subtotal + bônus livros) × (1 − dízimo%)
export function calcFinal(subtotal, bookBonus, tithePercent = 0, savingsPercent = 0) {
  const gross = subtotal + bookBonus
  const tithe = gross * (tithePercent / 100)
  const savings = gross * (savingsPercent / 100)
  const net   = gross - tithe - savings
  return { gross, tithe, savings, net }
}

// Semana perfeita: nenhuma so_penalidade com affectsStreak foi marcada
export function hadPerfectWeek(tasks, entries) {
  return !entries.some(e => {
    if (!e.checked) return false
    const t = tasks.find(t => t.id === e.taskId)
    return t?.type === 'so_penalidade' && t?.affectsStreak
  })
}

// ISO week id  →  "2026-W14"
export function getISOWeekId(date = new Date()) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo    = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
