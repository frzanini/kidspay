# KidsPay — Spec de Migração Visual UX v2

> Baseado nos mockups `img/frontend_app.png` (mobile) e `img/frontnd_pc.png` (desktop).  
> **Escopo:** migração visual de todas as telas + seleção de avatar 3D (única mudança funcional).  
> Atualizado: 2026-04-03

---

## Status de implementação

| Área                              | Status     | Arquivo                                              |
|-----------------------------------|------------|------------------------------------------------------|
| Design system (tokens, Nunito)    | ✅ Feito   | `src/index.css`                                      |
| Assets (avatares, paisagem)       | ✅ Feito   | `src/assets/avatars/`, `src/assets/paisagem.png`     |
| `avatarAssets.js`                 | ✅ Feito   | `src/lib/avatarAssets.js`                            |
| `AvatarPicker`                    | ✅ Feito   | `src/components/shared/AvatarPicker.jsx`             |
| `HeroSection`                     | ✅ Feito   | `src/components/child/HeroSection.jsx`               |
| `TaskCard`                        | ✅ Feito   | `src/components/child/TaskCard.jsx`                  |
| `TodayCard`                       | ✅ Feito   | `src/components/child/TodayCard.jsx`                 |
| `WeeklyProgressChart`             | ✅ Feito   | `src/components/child/WeeklyProgressChart.jsx`       |
| `BottomNav`                       | ✅ Feito   | `src/components/shared/BottomNav.jsx`                |
| `ChildMode` (reescrito)           | ✅ Feito   | `src/pages/ChildMode.jsx`                            |
| `Onboarding` visual completo      | ✅ Feito   | `src/pages/Onboarding.jsx`                           |
| `TemplateStep` visual             | ✅ Feito   | `src/components/onboarding/TemplateStep.jsx`         |
| `ParentMode` visual completo      | ✅ Feito   | `src/pages/ParentMode.jsx`                           |
| `TaskForm` visual                 | ✅ Feito   | `src/components/config/TaskForm.jsx`                 |

**Todas as etapas de implementação concluídas. Build de produção verificado e limpo.**

---

## 1. Princípio desta migração

O app já tem toda a lógica funcionando. Esta spec descreve **como revestir** cada tela e componente existente com o novo design — mantendo os stores, hooks, cálculos e fluxos intactos.

Arquivos migrados:
- `src/pages/ChildMode.jsx` — ✅ reescrito
- `src/pages/ParentMode.jsx` — ✅ migrado
- `src/pages/Onboarding.jsx` — ✅ migrado
- `src/components/shared/Header.jsx` — substituído por `BottomNav` ✅
- `src/components/config/TaskForm.jsx` — ✅ migrado

---

## 2. Design System

### 2.1 Paleta

| Token                    | Hex                        | Uso                                        |
|--------------------------|----------------------------|--------------------------------------------|
| `--color-primary`        | `#5C8C3E`                  | Botões, tabs ativas, checkboxes            |
| `--color-primary-light`  | `#7AB355`                  | Hover, barras de progresso, gradientes     |
| `--color-primary-glow`   | `rgba(92,140,62,0.22)`     | Glow do slider thumb                       |
| `--color-task-bg`        | `#E8A020`                  | Card de tarefa pendente                    |
| `--color-task-done`      | `#9A6010`                  | Card de tarefa concluída                   |
| `--color-task-glow`      | `rgba(232,160,32,0.38)`    | Sombra colorida das task cards             |
| `--color-surface`        | `#FFFFFF`                  | Cards, painéis, modais                     |
| `--color-bg`             | `#F5F2ED`                  | Fundo geral                                |
| `--color-text`           | `#1A1A1A`                  | Texto principal                            |
| `--color-muted`          | `#888888`                  | Textos secundários                         |
| `--color-muted-warm`     | `#B8B4AE`                  | Inativo nav, sub-labels — cinza quente     |
| `--color-coin`           | `#F59E0B`                  | Ícone de moeda                             |
| `--color-border`         | `#EDE9E3`                  | Bordas suaves                              |

### 2.2 Tipografia

- Fonte principal: **Nunito** (Google Fonts, weights 400/600/700/800) ✅
- Fonte display/números: **Fraunces** (Google Fonts) ✅ — usada no saldo do hero
- Hierarquia:
  - Saldo hero: `40px / 700`, Fraunces, `letter-spacing: -0.03em`
  - Títulos de seção: `20–22px / 800`, `letter-spacing: -0.02em`
  - Nome de tarefa: `14px / 700`
  - Valores/badges: `12px / 800`, `letter-spacing: -0.01em`
  - Labels/muted: `12px / 700`, `letter-spacing: 0.02em`
  - Labels uppercase: `11px / 700`, `letter-spacing: 0.08em`

### 2.3 Tokens de forma e sombras

```css
--radius-card:    20px;
--radius-badge:   999px;
--radius-task:    18px;

--shadow-xs:   0 1px 2px rgba(0,0,0,0.05);
--shadow-sm:   0 2px 8px rgba(0,0,0,0.06);
--shadow-md:   0 4px 16px rgba(0,0,0,0.08);
--shadow-lg:   0 8px 32px rgba(0,0,0,0.10);
--shadow-card: 0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07);
--shadow-task: 0 4px 16px var(--color-task-glow), inset 0 1px 0 rgba(255,255,255,0.22);
--shadow-task-done: 0 2px 8px rgba(154,96,16,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
```

### 2.4 Timing e easing

```css
--dur-fast:    150ms;
--dur-base:    220ms;
--dur-slow:    380ms;
--ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
--ease-back:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* leve overshoot */
```

### 2.5 Keyframes implementados

| Animação      | Uso                                          |
|---------------|----------------------------------------------|
| `float`       | Avatar hero (3.5s, leve rotação)             |
| `coin-fly`    | Feedback ao marcar tarefa (+valor sobe)      |
| `check-pop`   | Checkbox com overshoot ao marcar             |
| `slide-up`    | Entrada do TodayCard                         |
| `bar-grow`    | Barras do WeeklyProgressChart (staggered)    |
| `pulse-ring`  | Anel do avatar quando 100% concluído         |
| `step-in`     | Transição entre steps do Onboarding          |
| `step-back`   | Transição reversa entre steps                |
| `fade-up`     | Entrada genérica de elementos                |

---

## 3. Área da Criança — ✅ Implementado

### Componentes

| Arquivo                                        | Descrição                                        |
|------------------------------------------------|--------------------------------------------------|
| `src/components/child/HeroSection.jsx`         | Paisagem + avatar flutuante + nome + saldo       |
| `src/components/child/TaskCard.jsx`            | Card amarelo/dourado com checkbox e badge valor  |
| `src/components/child/TodayCard.jsx`           | Card branco flutuante + tabs Hábitos/Metas       |
| `src/components/child/WeeklyProgressChart.jsx` | Gráfico de barras diárias com animação staggered |
| `src/components/shared/BottomNav.jsx`          | Nav fixa 5 itens + menu "Mais" (toggle Modo Pais)|

### Detalhes de implementação

**HeroSection:**
- Paisagem `paisagem.png` como background fullbleed
- Overlay multicamada: `rgba(0,0,0,0.22)` → transparente → `#F5F2ED` (transição para TodayCard)
- Badge progresso: glass morphism com `backdrop-filter: blur(12px)`
- Avatar: anel gradiente verde quando `allDone`, animação `pulse-ring`, flutuação `float`
- Saldo: Fraunces 40px, textShadow para legibilidade sobre paisagem

**TaskCard:**
- Cor `bg`: `#E8A020` pendente → `#9A6010` concluída
- Sombra colorida: `rgba(232,160,32,0.40)` + `inset 0 1px 0 rgba(255,255,255,0.24)`
- `isPressed` state → `scale(0.97)` no touch
- Checkbox: gradiente verde quando checked, animação `check-pop` com overshoot
- Texto tachado em tarefas não-penalidade quando concluídas
- Animação `coin-fly` com deriva horizontal ao marcar

**TodayCard:**
- `border-radius: 28px 28px 0 0`, `marginTop: -28` (sobreposição na paisagem)
- Handle: gradiente verde `#7AB355 → #5C8C3E` (não cinza genérico)
- Classe `.kp-slide-up` para entrada animada
- Badge de progresso: vira verde + estrela quando `pct === 100`
- Tabs: gradiente ativo + `boxShadow`, transição spring

**WeeklyProgressChart:**
- Classe `.kp-bar` com `bar-grow` + `animation-delay: ${i * 60}ms` (staggered)
- Cores: hoje=gradiente verde, passado=`#A8CF80`, futuro=`#E8E4DE`, negativo=`#FCA5A5`
- Box-shadow verde na barra de hoje

**BottomNav:**
- 5 itens: Hoje, Metas, Avisos (inativo), Histórico, Mais
- Inativo: `#B8B4AE` (warm gray, token `--color-muted-warm`)
- Ativo: `#5C8C3E` + pill de fundo `rgba(92,140,62,0.10)` atrás do ícone
- "Mais" abre popover com toggle Modo Pais/Filho
- Pressionar "Histórico" navega para `/parents`

### Comportamento das tabs

| Tab              | Tipos de tarefa exibidos                                      |
|------------------|---------------------------------------------------------------|
| Hábitos Diários  | `habito`, `obrigatorio`, `so_penalidade`, `simbolico`         |
| Metas            | `so_credito`                                                  |

---

## 4. Seleção de Avatar 3D — ✅ Implementado

### 4.1 Assets

`src/assets/avatars/`:

| Arquivo       | Personagem                |
|---------------|---------------------------|
| `garota1.png` | Menina cabelo escuro liso |
| `garota2.png` | Menina (variação 2)       |
| `garota3.png` | Menina (variação 3)       |
| `garoto1.png` | Menino cabelo castanho    |
| `garoto2.png` | Menino (variação 2)       |

### 4.2 `resolveAvatar()` — retrocompatibilidade

```js
resolveAvatar(photo):
  null/undefined  → garota1 (padrão)
  "data:image/…"  → retorna como está (foto uploadada — legado)
  "garota1.png"   → importa o asset correspondente (novo fluxo)
  emoji antigo    → retorna garota1 (fallback)
```

### 4.3 `AvatarPicker` — ✅ Criado

`src/components/shared/AvatarPicker.jsx`

- Grade de 5 avatares em 3 colunas (3 meninas, 2 meninos)
- Item selecionado: `border: 3px solid #5C8C3E` + `box-shadow: 0 0 0 4px rgba(92,140,62,0.2)`
- Props: `value: string` (chave, ex: `"garota1.png"`), `onChange: (key) => void`
- Usado em: Onboarding passo 1 e ParentMode aba Perfil

---

## 5. Onboarding — ✅ Implementado

### Mudanças aplicadas

**Passo 1 — Nome e avatar:**
- Grid de emojis → `AvatarPicker`
- Botão "Usar foto" → removido
- `selectedAvatar` default: `'garota1.png'` (não emoji)
- Preview do avatar: `resolveAvatar(selectedAvatar)` na imagem circular
- Input nome: borda `#E5E7EB`, focus `#5C8C3E`, `border-radius: 12px`
- Fundo: `#F5F2ED` (sem gradiente escuro)

**Passo 2 — Config financeira:**
- Cards brancos com `box-shadow`
- Sliders: classe `.kp-slider` com tokens `--color-primary`
- Valores exibidos em badges arredondados `#F5F2ED`

**Passo 3 — Templates:**
- `TemplateStep.jsx` reescrito: cards brancos, borda esquerda colorida por template
- Badge "Recomendado": `background: #5C8C3E`, texto branco
- Tags: pill style com cor accent do template

**Navegação:**
- Botão Próximo/Começar: `background: #5C8C3E`, `border-radius: 14px`
- Botão Voltar: `background: #F5F2ED`, `color: #888`
- StepDots: pill ativa `#5C8C3E 24×8px`, inativa `#D1D5DB 8×8px`

---

## 6. ParentMode — ✅ Implementado

### Mudanças aplicadas

**Container:**
- Header removido → `BottomNav` adicionado (item "Histórico" ativo)
- Fundo: `#F5F2ED`
- FAB: `bottom: 88px` (acima do BottomNav), `background: #5C8C3E`

**Tab bar:**
- Pill ativa: `background: #5C8C3E`, texto branco
- Pill inativa: `background: #F5F2ED`, texto `#888`
- Container: branco com `border-radius: 16px`, `box-shadow`

**Aba Tarefas:**
- Itens: cards brancos `border-radius: 14px`, sombra suave
- Botão `+ Nova tarefa`: `#5C8C3E`
- Inativo: `opacity: 0.45`

**Aba Semana:**
- Cards de resumo: brancos com `border-radius: 20px`
- Créditos `#5C8C3E`, débitos `#EF4444`
- Card resultado: gradiente verde
- Botão fechar: `background: #5C8C3E`, grande

**Aba Histórico:**
- Cards brancos por semana
- Saldo: `#5C8C3E / 800`
- Badge semana perfeita: dourado

**Aba Perfil:**
- Grid de emojis → `AvatarPicker`
- Preview avatar: `resolveAvatar(photo)` em `<img>` circular 80px
- Default: `'garota1.png'`
- Inputs, sliders e toggles: design system aplicado
- Botão salvar: `#5C8C3E`

---

## 7. TaskForm — ✅ Implementado

- Fundo do modal: `white`
- Handle: `#E5E7EB`, 40×4px
- Inputs: `border: 1px solid #E5E7EB`, `background: #F5F2ED`, focus `#5C8C3E`
- Pills de tipo: inativo `#F5F2ED`, ativo colorido por tipo
- Pills de categoria: inativo `#F5F2ED`, ativo `#5C8C3E`
- Botão Salvar: `#5C8C3E`
- Botão Excluir: `color: #EF4444`

---

## 8. O que NÃO muda

- Stores IndexedDB (`profile`, `tasks`, `checklist`, `weeks`)
- Hooks (`useProfile`, `useTasks`, `useChecklist`, `useWeekData`, `useWeeksHistory`)
- `calculations.js` — fórmula de saldo, bônus de leitura, semana perfeita
- `db.js` — estrutura do banco
- `samuel-template.js` — templates de onboarding
- Fluxo de fechamento de semana
- Lógica de detecção de semana perfeita
- Validação e tipos de tarefa no `TaskForm`
- Roteamento (`App.jsx`)

---

## 9. Funcionalidades dos mockups fora do escopo MVP

| Feature visível nos mockups   | Motivo para não implementar           |
|-------------------------------|---------------------------------------|
| Leaderboard (ranking global)  | Requer backend e múltiplos perfis     |
| Current Goals com estrelas    | Modelo de metas diferente do atual    |
| Comunidade / Statistics       | Funcionalidades futuras               |
| Search bar                    | Sem conteúdo suficiente para busca    |
| Notificações push             | Fora do escopo MVP                    |
