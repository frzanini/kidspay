# KidsPay — Spec de Migração Visual UX v2

> Baseado nos mockups `img/frontend_app.png` (mobile) e `img/frontnd_pc.png` (desktop).  
> **Escopo:** alteração principalmente visual, com uma única mudança funcional: seleção de avatar 3D.  
> Data: 2026-04-02

---

## 1. Princípio desta migração

O app já tem toda a lógica funcionando. Esta spec descreve **como revestir** cada tela e componente existente com o novo design — mantendo os stores, hooks, cálculos e fluxos intactos.

Referência do que existe hoje:
- `ChildMode.jsx` — tela principal da criança
- `ParentMode.jsx` — dashboard dos pais (abas: Tarefas | Semana | Histórico | Perfil)
- `Onboarding.jsx` — wizard de 3 passos
- `Header.jsx` — barra de navegação com toggle filho/pais
- `TaskForm.jsx` — modal de criação/edição de tarefas

---

## 2. Design System

### 2.1 Paleta (substituir o dark theme atual)

| Token             | Hex         | Substituição do atual        |
|-------------------|-------------|------------------------------|
| `--color-primary` | `#5C8C3E`   | `#10b981` (verde atual)      |
| `--color-task-bg` | `#E8A020`   | Cards de tarefa pendente     |
| `--color-task-done`| `#9A6010`  | Cards de tarefa concluída    |
| `--color-surface` | `#FFFFFF`   | `#1e293b` (dark atual)       |
| `--color-bg`      | `#F5F2ED`   | `#0f172a` (dark atual)       |
| `--color-text`    | `#1A1A1A`   | Texto geral                  |
| `--color-muted`   | `#888888`   | Textos secundários           |
| `--color-coin`    | `#F59E0B`   | Ícone e valor de saldo       |

**Mudança fundamental:** o app passa de dark theme para light theme com hero colorido.

### 2.2 Tipografia

- Fonte: `Nunito` (adicionar via Google Fonts no `index.html`)
- Hierarquia:
  - Saldo hero: `48px / 800`
  - Títulos de seção: `20px / 700`
  - Nome de tarefa: `15px / 600`
  - Valor coins: `14px / 700`
  - Texto secundário: `13px / 400`

### 2.3 Bordas e Elevação

```css
--radius-card: 20px;
--radius-badge: 999px;
--shadow-card: 0 4px 16px rgba(0,0,0,0.08);
--shadow-hero-card: 0 -8px 32px rgba(0,0,0,0.12); /* card flutuante sobre hero */
```

---

## 3. Mapeamento de Telas

### 3.1 ChildMode → nova tela principal

**Arquivo:** `src/pages/ChildMode.jsx`

#### Hero Section (substitui o cabeçalho atual)

O topo cinza/escuro com avatar e nome vira um painel com:

```
┌─────────────────────────────┐
│  [Avatar]  Abigail  [23/54] │  ← nome + badge de progresso
│        R$ 259,82            │  ← saldo semanal acumulado (formato atual)
│     moedas acumuladas       │  ← legenda
│  [paisagem 3D de fundo]     │
└─────────────────────────────┘
```

**Dados que já existem:**
- `profile.childName` → nome
- `profile.photo` → avatar
- saldo acumulado → resultado de `calcWeekSummary()` (já calculado)
- progresso `23/54` → tarefas concluídas no dia / total de tarefas ativas

> **Nota de saldo:** manter BRL (R$). Não converter para "coins" inteiros — a lógica de cálculo não muda. O visual usa o mesmo número, apenas com nova tipografia e cor.

**Asset necessário:** imagem de paisagem 3D (PNG estático, ~375×280px, fundo transparente ou com céu).

#### TodayCard (substitui a lista atual por categoria)

O card branco flutuante com `margin-top: -24px` sobre o hero.

```
┌─────────────────────────────────┐
│  Hoje              [📅]         │
│  [Hábitos Diários] [Metas]      │  ← tabs
│  ┌────────────────────────┐     │
│  │ ☐  Tarefa A      R$0,50 │    │  ← TaskCard pendente (amarelo)
│  └────────────────────────┘     │
│  ┌────────────────────────┐     │
│  │ ☑  Tarefa B      R$0,40 │    │  ← TaskCard concluído (dourado escuro)
│  └────────────────────────┘     │
└─────────────────────────────────┘
```

**Tab "Hábitos Diários":** mostra tarefas dos tipos `habito`, `obrigatorio`, `so_penalidade`.  
**Tab "Metas":** mostra tarefas do tipo `so_credito` (bônus opcionais — já existem no modelo).  
**Tarefas `simbolico`:** aparecem na aba Hábitos sem valor monetário exibido.

A **agrupação por categoria** (Espiritual, Físico, etc.) é mantida internamente mas visualmente fica oculta — as tarefas ficam em lista contínua, sem cabeçalhos de grupo. Isso é um ajuste de layout, não de lógica.

#### TaskCard (substitui os itens de lista atuais)

| Estado      | Estilo                                               |
|-------------|------------------------------------------------------|
| Pendente    | `background: #E8A020`, checkbox vazio, texto branco  |
| Concluída   | `background: #9A6010`, checkbox verde preenchido     |

Estrutura interna:
- Esquerda: checkbox (quadrado, `border-radius: 6px`)
- Centro: nome da tarefa (branco, bold)
- Direita: badge branco com valor (`R$ 0,50` ou `R$ 0,40`)

**Tarefas `so_penalidade`:** badge exibe o débito em vermelho claro.  
**Tarefas `simbolico`:** sem badge de valor.

A animação de moeda ao completar uma tarefa (já existente) é mantida.

#### Abas de dia da semana

As tabs Seg/Ter/Qua/Qui/Sex permanecem funcionando. Visualmente migram para pills horizontais com scroll acima do TodayCard, ou são movidas para dentro do TodayCard como sub-navegação.

#### Barra de progresso semanal

A `ProgressCard` atual (barra linear com saldo vs meta semanal) é substituída pelo **WeeklyProgressChart** — gráfico de barras verticais por dia da semana, abaixo do TodayCard.

**Dados que já existem:** `useChecklist(weekId, dayIndex)` retorna os dados por dia. Os valores já são calculados; basta remapear para o novo visual em barras.

```
Progresso Semanal      R$ 5,60 esta semana
  ▐█▌ ▐█▌ ▐█▌ ▐██▌ ▐▌ ▐▌ ▐▌
   S   T   Q   Q    S   S   D
```

---

### 3.2 Header → BottomNav (mobile) + TopNav (desktop)

**Arquivo:** `src/components/shared/Header.jsx`

O header horizontal atual é substituído por:

#### BottomNav (mobile, < 1024px)

```
 🏠      🎯      🔔      📅      ⠿
Hoje   Metas   (vazio)  Hist.  Mais
```

| Ícone    | Destino atual                          |
|----------|----------------------------------------|
| 🏠 Casa  | `ChildMode` — tab Hábitos Diários      |
| 🎯 Metas | `ChildMode` — tab Metas (so_credito)   |
| 🔔 Sino  | Sem funcionalidade ainda → inativo     |
| 📅 Hist. | `ParentMode` → aba Histórico           |
| ⠿ Mais   | Menu com: **Modo Pais** (toggle atual) |

> O toggle Filho/Pais que hoje fica no Header migra para o item "Mais" do BottomNav.

#### TopNav (desktop, ≥ 1024px)

```
KidsPay   [Hoje] [Metas] [Histórico] [Configurar]   [Avatar Abigail ▾]
```

| Link         | Destino atual                   |
|--------------|---------------------------------|
| Hoje         | `ChildMode`                     |
| Metas        | `ChildMode` tab Metas           |
| Histórico    | `ParentMode` aba Histórico      |
| Configurar   | `ParentMode` aba Tarefas/Perfil |
| Avatar       | Dropdown → Modo Pais / Perfil   |

---

### 3.3 ParentMode — ajuste cosmético, layout preservado

**Arquivo:** `src/pages/ParentMode.jsx`

> **Sem mockup disponível para esta área.** O layout atual (abas horizontais, listas, modais) é mantido integralmente. Apenas o design system é aplicado.

Funcionalidade e estrutura de layout 100% preservadas. Aplicar somente:

1. Fundo muda de `#0f172a` para `#F5F2ED`
2. Cards e painéis: `background: white`, `border-radius: 20px`, `box-shadow: var(--shadow-card)`
3. Abas (Tarefas | Semana | Histórico | Perfil): pill verde quando ativa, cinza claro quando inativa
4. Inputs, selects e toggles: bordas arredondadas, `border-color: #D1D5DB`, focus em verde
5. Botões primários: `background: #5C8C3E`, `border-radius: 12px`, texto branco
6. Botões destrutivos (excluir): `background: #EF4444`, mesmo border-radius
7. TaskForm modal: slide-up mantido, fundo branco, handle cinza no topo
8. Fonte: Nunito em todos os textos

O layout desta área será revisado em uma fase posterior, quando houver mockup da UX dos pais.

---

### 3.4 Onboarding — só ajuste visual

**Arquivo:** `src/pages/Onboarding.jsx`

Funcionalidade 100% preservada (3 passos, templates, validação). Ajustes visuais:

1. Fundo: gradiente suave `#F5F2ED → #E8F5E0`
2. Cards de step com shadow e border-radius 20px
3. StepDots: pills verdes
4. Seleção de avatar: grid de emojis com borda verde ao selecionar
5. Cards de template (`TemplateStep`): novo estilo com accent-color como borda esquerda colorida

---

## 4. Layout Desktop — 3 Colunas

No desktop (≥ 1024px), `ChildMode` exibe 3 colunas lado a lado:

```
┌─────────────────────────────────────────────────────┐
│ TOP NAV                                             │
├────────────┬──────────────────────┬─────────────────┤
│  COLUNA 1  │    COLUNA 2          │   COLUNA 3      │
│  HeroCard  │  TodayCard           │  WeekSummary    │
│  (perfil   │  (lista completa     │  (gráfico +     │
│  + saldo)  │   + gráfico semanal) │   resumo R$)    │
└────────────┴──────────────────────┴─────────────────┘
```

**Coluna 3 (desktop only):** exibe o que hoje está espalhado em `ProgressCard` e `TotalsCard`:
- Saldo acumulado da semana
- Meta semanal e % de avanço
- Créditos / débitos / líquido
- Badge "Semana perfeita em jogo" (se aplicável)

Esses dados já existem — é só reposicioná-los.

---

## 5. Componentes a criar / refatorar

| Componente            | Ação            | Baseado em                          |
|-----------------------|-----------------|-------------------------------------|
| `HeroSection`         | Criar           | Parte do `ChildMode` (header atual) |
| `TodayCard`           | Criar           | Container do checklist atual        |
| `TaskCard`            | Criar           | Items de lista em `ChildMode`       |
| `WeeklyProgressChart` | Criar           | `ProgressCard` (barra → barras)     |
| `BottomNav`           | Criar           | Substitui `Header`                  |
| `TopNav`              | Criar           | Substitui `Header` no desktop       |
| `Header`              | Remover         | Substituído por Bottom/TopNav       |
| `ParentMode`          | Refatorar estilo| Sem mudança de lógica               |
| `Onboarding`          | Refatorar estilo| Sem mudança de lógica               |
| `TaskForm`            | Refatorar estilo| Sem mudança de lógica               |

---

## 6. Assets necessários

| Asset                   | Formato | Notas                                           |
|-------------------------|---------|--------------------------------------------------|
| Paisagem hero           | PNG     | ~375×300px, fundo céu degradê com colinas verdes |
| Ícones BottomNav        | SVG     | Casa, alvo, sino, calendário, grade — 24px       |
| Ícone moeda             | SVG     | 16px e 20px, cor `#F59E0B`                       |
| Fonte Nunito            | Google Fonts | Weights 400, 600, 700, 800               |

---

## 7. O que NÃO muda

- Stores do IndexedDB (`profile`, `tasks`, `checklist`, `weeks`)
- Hooks customizados (`useProfile`, `useTasks`, `useChecklist`, `useWeekData`, `useWeeksHistory`)
- `calculations.js` — fórmula de saldo, bônus de leitura, semana perfeita
- `db.js` — estrutura do banco
- `samuel-template.js` — templates de onboarding
- Fluxo de fechamento de semana
- Lógica de detecção de semana perfeita
- Validação e tipos de tarefa no `TaskForm`
- Roteamento (`App.jsx`)

---

## 8. Funcionalidades presentes nas imagens que NÃO serão implementadas

As imagens mostram features que não existem no app atual e **ficam fora do escopo desta migração**:

| Feature visível nos mockups | Motivo para não implementar          |
|-----------------------------|--------------------------------------|
| Leaderboard (ranking global)| Requer backend e múltiplos perfis    |
| Current Goals com estrelas  | Modelo de metas diferente do atual   |
| Comunidade / Statistics     | Funcionalidades futuras              |
| Search bar                  | Sem conteúdo suficiente para busca   |
| Notificações push           | Fora do escopo MVP                   |

---

## 9. Seleção de Avatar 3D (única mudança funcional)

### 9.1 Contexto

Os arquivos em `docs/ux_v2/img/` incluem 5 avatares 3D cartoon prontos para uso:

| Arquivo       | Personagem               |
|---------------|--------------------------|
| `garota1.png` | Menina cabelo escuro liso |
| `garota2.png` | Menina (variação 2)       |
| `garota3.png` | Menina (variação 3)       |
| `garoto1.png` | Menino cabelo castanho    |
| `garoto2.png` | Menino (variação 2)       |

Esses arquivos precisam ser copiados para `kidspay/src/assets/avatars/` para serem importados pelo Vite.

### 9.2 Mudança no `profile.photo`

Hoje o campo `profile.photo` armazena:
- Emoji (ex.: `"🧒"`) — seleção do grid atual
- `data:image/...` — upload de foto

Com a nova UX, passa a armazenar o **nome do arquivo do asset** (ex.: `"garota1.png"`).

Perfis existentes com emoji ou `data:image` continuam funcionando — o componente `HeroSection` detecta o formato:

```js
function resolveAvatar(photo) {
  if (!photo) return avatarDefault;               // garota1.png como padrão
  if (photo.startsWith('data:')) return photo;    // foto uploadada — mantém
  if (photo.length <= 2) return null;             // emoji antigo — ignorar ou fallback
  return avatarMap[photo] ?? avatarDefault;       // asset 3D (novo fluxo)
}
```

### 9.3 Grade de seleção de avatar

Substitui o grid de emojis no:
- **Onboarding** — Passo 1 (nome + avatar)
- **ParentMode** — Aba Perfil

```
┌──────────────────────────────────────────┐
│  Escolha o avatar                        │
│                                          │
│  ┌────┐  ┌────┐  ┌────┐                 │
│  │ 👧 │  │ 👧 │  │ 👧 │  ← meninas     │
│  └────┘  └────┘  └────┘                 │
│  ┌────┐  ┌────┐                         │
│  │ 👦 │  │ 👦 │          ← meninos     │
│  └────┘  └────┘                         │
│                                          │
│  Avatar selecionado: borda verde + glow  │
└──────────────────────────────────────────┘
```

**Comportamento:**
- Exibe as 5 imagens PNG em grid (3 colunas)
- Avatar selecionado recebe `border: 3px solid #5C8C3E` + `box-shadow: 0 0 12px rgba(92,140,62,0.4)`
- `border-radius: 50%` nas imagens (circular, igual ao mockup)
- Ao salvar, grava o nome do arquivo (`"garota1.png"`) em `profile.photo`

### 9.4 Avatar no HeroSection

A imagem exibida no topo da tela é circular, com leve sombra e brilho na base (efeito de luminosidade visível nos mockups):

```css
.avatar-hero {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.25));
}
```

---

## 10. Ordem de implementação sugerida

1. Copiar assets para `src/assets/avatars/` e `src/assets/` (paisagem, avatares)
2. Design system — tokens CSS, fonte Nunito, classes Tailwind customizadas
3. `HeroSection` + paisagem de fundo + avatar 3D circular
4. Seletor de avatar 3D no `Onboarding` (passo 1) — substitui grid de emojis
5. `TaskCard` (estados pendente e concluído)
6. `TodayCard` com tabs Hábitos/Metas e lista de TaskCards
7. `BottomNav` mobile (com toggle Modo Pais no "Mais")
8. `WeeklyProgressChart` (migração da ProgressCard)
9. Layout desktop 3 colunas + `TopNav`
10. Refatoração visual de `ParentMode` — incluindo seletor de avatar na aba Perfil
11. Refatoração visual de `TaskForm`
12. Polimento: animações, transições, responsividade
