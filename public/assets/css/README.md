# Arquitetura CSS — SIGP

Documentação da estrutura e organização dos estilos do projeto SIGP.

---

## 🇧🇷 Português

### Índice

- [Filosofia](#filosofia)
- [Estrutura por Camadas](#estrutura-por-camadas)
- [Responsabilidade de Cada Pasta](#responsabilidade-de-cada-pasta)
- [Ordem de Carregamento](#ordem-de-carregamento)
- [CSS Custom Properties](#css-custom-properties)
- [Estratégia Mobile-First](#estratégia-mobile-first)
- [Sistema de Temas](#sistema-de-temas)
- [Como Adicionar um Novo Módulo](#como-adicionar-um-novo-módulo)
- [Como Criar um Novo Tema](#como-criar-um-novo-tema)
- [Boas Práticas](#boas-práticas)

---

### Filosofia

A organização CSS do SIGP segue uma **arquitetura por camadas** inspirada no ITCSS (Inverted Triangle CSS), onde os estilos são organizados do mais genérico para o mais específico:

```
base/        →  Fundação (reset, variáveis, tipografia)
components/  →  Elementos reutilizáveis
layout/      →  Estrutura global de páginas
modules/     →  Estilos específicos de features
themes/      →  Variações visuais (claro/escuro)
```

Essa abordagem garante:
- **Previsibilidade** — estilos genéricos nunca sobrescrevem específicos acidentalmente
- **Manutenibilidade** — cada alteração tem um local claro e único
- **Escalabilidade** — novos módulos não afetam os existentes
- **Zero conflitos** — especificidade crescente por camada

---

### Estrutura por Camadas

```
css/
├── base/                      # Camada 1 — Fundação
│   ├── base.css               # Reset, Custom Properties, variáveis globais, tipografia
│   ├── components.css         # Componentes base (botões, cards, inputs, containers)
│   ├── animations.css         # Todas as @keyframes e classes utilitárias de animação
│   ├── loader.css             # Loading overlay com spinner e checkmark de sucesso
│   └── responsive.css         # Media queries — breakpoints e ajustes responsivos
│
├── components/                # Camada 2 — Componentes Reutilizáveis
│   ├── tabs.css               # Sistema multi-aba (barra, estados, botões, conteúdo)
│   ├── forms.css              # Formulários de autenticação e transições
│   ├── _hero.css              # Seções hero (cabeçalhos de página)
│   ├── _containers.css        # Containers padrão reutilizáveis
│   └── _version.css           # Badge de versão no sidebar
│
├── layout/                    # Camada 3 — Layout Estrutural
│   └── dashboard.css          # Sidebar fixa, área principal, header, tab bar
│
├── modules/                   # Camada 4 — Estilos por Feature
│   ├── documents/
│   │   └── documents.css      # Upload, cards de documento, drag & drop
│   ├── exams/
│   │   └── exams.css          # Listagem e cards de exames médicos
│   ├── expenses/
│   │   ├── finance.css        # Gastos fixos e cartão de crédito
│   │   ├── income.css         # Renda mensal
│   │   └── reports.css        # Relatórios financeiros
│   ├── personal/
│   │   ├── personal.css       # Import central do módulo pessoal
│   │   ├── _base.css          # Estilos base compartilhados do módulo pessoal
│   │   ├── _tasks.css         # Tarefas
│   │   ├── _links.css         # Links úteis
│   │   ├── _passwords.css     # Gerenciador de senhas
│   │   ├── _shopping.css      # Lista de compras
│   │   └── _wishlist.css      # Lista de desejos
│   ├── settings/
│   │   └── settings.css       # Configurações (perfil, segurança, preferências)
│   ├── support/
│   │   └── support.css        # Página de suporte
│   └── training/
│       └── training.css       # Treinos (academia e corrida)
│
└── themes/                    # Camada 5 — Temas
    ├── light-theme.css        # Tema claro completo (sobrescreve variáveis e componentes)
    ├── tracking-light-theme.css  # Extensão light para módulo de treinos
    ├── sweet-alert2.css       # Estilos base do SweetAlert2
    └── sweet-alert-custom.css # Customizações do SweetAlert2 para o SIGP
```

---

### Responsabilidade de Cada Pasta

#### `base/` — Fundação

A camada mais genérica. Define as bases sobre as quais todo o restante é construído.

| Arquivo | Responsabilidade |
|---|---|
| `base.css` | CSS reset, Custom Properties (tokens de cor, espaçamento, tipografia), scrollbar customizada, classes utilitárias globais. Define o tema escuro como padrão. |
| `components.css` | Componentes base reutilizáveis: containers de autenticação, botões (`btn-primary`, `btn-secondary`, `btn-icon`, `btn-google`), inputs, cards, alertas, navegação. ~1.674 linhas. |
| `animations.css` | **Arquivo único de animações.** Todas as `@keyframes` do projeto: fade, slide, pulse, float, spin, scale, modal, checkbox-pop, form transitions. Classes utilitárias `.animate-*`. |
| `loader.css` | Loading overlay full-screen com spinner multi-anel, checkmark animado de sucesso e barra de progresso. Autocontido. |
| `responsive.css` | Media queries organizadas por breakpoint. **Deve ser o último CSS carregado** (exceto temas) para garantir override correto. |

#### `components/` — Elementos Reutilizáveis

Componentes de interface usados em múltiplos contextos.

| Arquivo | Responsabilidade |
|---|---|
| `tabs.css` | Sistema multi-aba completo: barra de abas com scroll horizontal, estados (ativo, hover, fechando), botões de fechar/refresh, área de conteúdo de cada aba, estado vazio. |
| `forms.css` | Estilos de formulários de autenticação (login, registro, recuperação), transições animadas entre formulários, notices informativos, botão de alternância de tema. |
| `_hero.css` | Seções hero para cabeçalhos de páginas internas. |
| `_containers.css` | Containers padronizados reutilizáveis em múltiplos módulos. |
| `_version.css` | Badge de versão exibido no rodapé da sidebar. |

> **Convenção:** Arquivos prefixados com `_` são parciais — componentes menores importados ou referenciados por outros.

#### `layout/` — Estrutura Global

Define a estrutura macro das páginas.

| Arquivo | Responsabilidade |
|---|---|
| `dashboard.css` | Layout completo do dashboard: sidebar fixa (280px), área de conteúdo principal, header com botão de menu, barra de abas, seções hero, sidebar responsiva (fullscreen no mobile). |

#### `modules/` — Estilos por Feature

Cada funcionalidade do sistema possui seus estilos isolados nesta pasta.

| Pasta | Escopo |
|---|---|
| `documents/` | Cards de documentos, área de upload, drag & drop visual, estados vazios |
| `exams/` | Listagem de exames médicos, cards informativos, indicadores de status |
| `expenses/` | Tabelas financeiras, cards de despesas fixas e crédito, formulários de renda, gráficos de relatório |
| `personal/` | Módulo pessoal subdividido: tarefas, links, senhas, compras, wishlist — com `personal.css` como ponto de entrada e parciais `_*.css` |
| `settings/` | Painel de configurações: cards de perfil, segurança, preferências de notificações, informações da conta |
| `support/` | Página de suporte e FAQ |
| `training/` | Treinos de academia (exercícios, séries, calendário de tracking) e corrida |

#### `themes/` — Variações Visuais

Define e aplica variações de tema.

| Arquivo | Responsabilidade |
|---|---|
| `light-theme.css` | Tema claro completo. Usa seletor `body.light-theme` para sobrescrever Custom Properties e estilos de todos os componentes e módulos. ~1.992 linhas. |
| `tracking-light-theme.css` | Extensão do tema claro específica para o módulo de treinos (calendário, cards de estatísticas). |
| `sweet-alert2.css` | Estilos base do SweetAlert2 integrados ao projeto. |
| `sweet-alert-custom.css` | Customizações visuais do SweetAlert2 para manter consistência com o design system do SIGP. |

---

### Ordem de Carregamento

A ordem de importação dos CSS é crítica para o funcionamento correto da cascata:

```html
<!-- 1. Base — Fundação -->
<link rel="stylesheet" href="assets/css/base/base.css">
<link rel="stylesheet" href="assets/css/base/components.css">
<link rel="stylesheet" href="assets/css/base/loader.css">
<link rel="stylesheet" href="assets/css/base/animations.css">

<!-- 2. Layout — Estrutura -->
<link rel="stylesheet" href="assets/css/layout/dashboard.css">

<!-- 3. Components — Elementos reutilizáveis -->
<link rel="stylesheet" href="assets/css/components/tabs.css">
<link rel="stylesheet" href="assets/css/components/forms.css">
<link rel="stylesheet" href="assets/css/components/_hero.css">
<link rel="stylesheet" href="assets/css/components/_containers.css">
<link rel="stylesheet" href="assets/css/components/_version.css">

<!-- 4. Modules — Estilos por feature -->
<link rel="stylesheet" href="assets/css/modules/expenses/finance.css">
<link rel="stylesheet" href="assets/css/modules/personal/personal.css">
<!-- ... demais módulos -->

<!-- 5. Themes — Variações visuais -->
<link rel="stylesheet" href="assets/css/themes/light-theme.css">
<link rel="stylesheet" href="assets/css/themes/tracking-light-theme.css">

<!-- 6. Responsive — DEVE SER O ÚLTIMO (antes de alertas) -->
<link rel="stylesheet" href="assets/css/base/responsive.css">

<!-- 7. Alertas customizados (SweetAlert2) -->
<link rel="stylesheet" href="assets/css/themes/sweet-alert2.css">
<link rel="stylesheet" href="assets/css/themes/sweet-alert-custom.css">
```

> **Regra fundamental:** `responsive.css` deve vir após todos os estilos de módulos e temas para que as media queries possam sobrescrever qualquer propriedade corretamente.

---

### CSS Custom Properties

O projeto utiliza CSS Custom Properties (variáveis) como base do design system. Todas são definidas em `base.css`:

```css
:root {
    /* Cores primárias (tema escuro — padrão) */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --accent-primary: #3b82f6;
    --accent-hover: #2563eb;
    
    /* Espaçamento */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Bordas e sombras */
    --border-radius: 8px;
    --border-color: #334155;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
    
    /* Tipografia */
    --font-family: 'Segoe UI', system-ui, sans-serif;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    
    /* Transições */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
}
```

O tema claro sobrescreve essas variáveis via classe:

```css
body.light-theme {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    /* ... */
}
```

---

### Estratégia Mobile-First

O projeto adota uma abordagem **responsiva progressiva** com breakpoints definidos em `responsive.css`:

| Breakpoint | Target | Descrição |
|---|---|---|
| Base (sem query) | Mobile | Estilos padrão otimizados para mobile |
| `≤ 390px` | Extra Small | Celulares compactos (iPhone SE) |
| `≤ 480px` | Small Mobile | Celulares pequenos |
| `481px – 576px` | Mobile | Celulares padrão |
| `577px – 768px` | Tablet | Tablets em retrato |
| `> 1024px` | Desktop | Desktops e laptops |

**Características responsivas:**
- Sidebar transforma-se em menu fullscreen no mobile
- Área de toque mínima de `44px` em elementos interativos
- Prevenção de zoom em inputs no iOS (`maximum-scale=1.0`)
- Suporte a `safe-area-inset` para dispositivos com notch e Dynamic Island
- Tabs com scroll horizontal em telas menores

---

### Sistema de Temas

#### Como Funciona

1. O tema escuro é o **padrão** — definido nas Custom Properties de `:root`
2. O tema claro é ativado pela classe `body.light-theme`
3. O `ThemeManager.js` gerencia alternância, persistência e prevenção de FOUC
4. Cada módulo pode ter extensões de tema (ex: `tracking-light-theme.css`)

#### Estrutura de um Tema

```css
/* Em themes/light-theme.css */

/* 1. Sobrescrever Custom Properties globais */
body.light-theme {
    --bg-primary: #ffffff;
    --text-primary: #1e293b;
    /* ... */
}

/* 2. Ajustes específicos por componente */
body.light-theme .sidebar { /* ... */ }
body.light-theme .card { /* ... */ }
body.light-theme .btn-primary { /* ... */ }

/* 3. Ajustes por módulo (se necessário) */
body.light-theme .expense-card { /* ... */ }
body.light-theme .training-calendar { /* ... */ }
```

---

### Como Adicionar um Novo Módulo

1. **Criar a pasta** em `modules/`:
   ```
   modules/meu-modulo/
   └── meu-modulo.css
   ```

2. **Escrever os estilos** usando as Custom Properties existentes:
   ```css
   .meu-modulo-container {
       background: var(--bg-secondary);
       color: var(--text-primary);
       border-radius: var(--border-radius);
       padding: var(--spacing-lg);
   }
   
   .meu-modulo-card {
       border: 1px solid var(--border-color);
       box-shadow: var(--shadow-sm);
       transition: var(--transition-normal);
   }
   ```

3. **Adicionar ao HTML** na posição correta (antes de themes e responsive):
   ```html
   <!-- Modules -->
   <link rel="stylesheet" href="assets/css/modules/meu-modulo/meu-modulo.css">
   ```

4. **Adicionar suporte ao tema claro** em `light-theme.css`:
   ```css
   /* === Meu Módulo === */
   body.light-theme .meu-modulo-container { /* ... */ }
   body.light-theme .meu-modulo-card { /* ... */ }
   ```

5. **Adicionar media queries** em `responsive.css`:
   ```css
   /* === Meu Módulo — Mobile === */
   @media (max-width: 768px) {
       .meu-modulo-container { /* ... */ }
   }
   ```

---

### Como Criar um Novo Tema

1. **Criar o arquivo** em `themes/`:
   ```
   themes/meu-tema.css
   ```

2. **Definir o seletor de ativação**:
   ```css
   body.meu-tema {
       /* Sobrescrever Custom Properties */
       --bg-primary: #1a1a2e;
       --bg-secondary: #16213e;
       --accent-primary: #e94560;
       --text-primary: #eee;
       /* ... todas as variáveis necessárias */
   }
   ```

3. **Adicionar overrides específicos** para componentes que precisam de ajuste fino:
   ```css
   body.meu-tema .sidebar { /* ... */ }
   body.meu-tema .btn-primary { /* ... */ }
   ```

4. **Registrar no** `ThemeManager.js` para ser incluído no ciclo de alternância.

5. **Vincular no HTML** após os temas existentes:
   ```html
   <link rel="stylesheet" href="assets/css/themes/meu-tema.css">
   ```

---

### Boas Práticas

| Prática | Descrição |
|---|---|
| **Use Custom Properties** | Sempre referencie variáveis ao invés de valores fixos para manter consistência e suporte a temas |
| **Prefixe por módulo** | Use prefixos como `.expense-`, `.training-`, `.personal-` para evitar colisões de nomes |
| **Não use `!important`** | A especificidade por camadas torna `!important` desnecessário |
| **Animações centralizadas** | Defina `@keyframes` em `animations.css` — nunca em arquivos de módulo |
| **Responsivo no final** | Media queries sempre em `responsive.css`, carregado por último |
| **Parciais com `_`** | Arquivos auxiliares que não são importados diretamente no HTML usam prefixo `_` |
| **Evite estilos inline** | Use classes CSS. Estilos inline de JS foram refatorados para classes reutilizáveis |
| **Documente seções** | Use comentários `/* === Seção === */` para delimitar blocos dentro de arquivos grandes |
| **Minimalismo no seletor** | Prefira uma classe (`.card-title`) a um seletor composto (`.card > .content > h3`) |
| **Tema claro como override** | O tema claro sobrescreve o escuro — nunca duplique estilos base |

---

---

## 🇺🇸 English Version

### Table of Contents

- [Philosophy](#philosophy)
- [Layered Structure](#layered-structure)
- [Folder Responsibilities](#folder-responsibilities)
- [Loading Order](#loading-order)
- [CSS Custom Properties](#css-custom-properties-1)
- [Mobile-First Strategy](#mobile-first-strategy)
- [Theme System](#theme-system-1)
- [Adding a New Module](#adding-a-new-module)
- [Creating a New Theme](#creating-a-new-theme)
- [Best Practices](#best-practices)

---

### Philosophy

The SIGP CSS organization follows a **layered architecture** inspired by ITCSS (Inverted Triangle CSS), where styles are organized from the most generic to the most specific:

```
base/        →  Foundation (reset, variables, typography)
components/  →  Reusable elements
layout/      →  Global page structure
modules/     →  Feature-specific styles
themes/      →  Visual variations (light/dark)
```

This approach ensures:
- **Predictability** — generic styles never accidentally override specific ones
- **Maintainability** — each change has a clear and unique location
- **Scalability** — new modules don't affect existing ones
- **Zero conflicts** — increasing specificity per layer

---

### Layered Structure

```
css/
├── base/                      # Layer 1 — Foundation
│   ├── base.css               # Reset, Custom Properties, global variables, typography
│   ├── components.css         # Base components (buttons, cards, inputs, containers)
│   ├── animations.css         # All @keyframes and animation utility classes
│   ├── loader.css             # Loading overlay with spinner and success checkmark
│   └── responsive.css         # Media queries — breakpoints and responsive adjustments
│
├── components/                # Layer 2 — Reusable Components
│   ├── tabs.css               # Multi-tab system (bar, states, buttons, content)
│   ├── forms.css              # Authentication forms and transitions
│   ├── _hero.css              # Hero sections (page headers)
│   ├── _containers.css        # Standardized reusable containers
│   └── _version.css           # Version badge in the sidebar
│
├── layout/                    # Layer 3 — Structural Layout
│   └── dashboard.css          # Fixed sidebar, main area, header, tab bar
│
├── modules/                   # Layer 4 — Feature Styles
│   ├── documents/
│   │   └── documents.css      # Upload, document cards, drag & drop
│   ├── exams/
│   │   └── exams.css          # Medical exams listing and cards
│   ├── expenses/
│   │   ├── finance.css        # Fixed and credit card expenses
│   │   ├── income.css         # Monthly income
│   │   └── reports.css        # Financial reports
│   ├── personal/
│   │   ├── personal.css       # Central import for the personal module
│   │   ├── _base.css          # Shared base styles
│   │   ├── _tasks.css         # Tasks
│   │   ├── _links.css         # Bookmarks
│   │   ├── _passwords.css     # Password manager
│   │   ├── _shopping.css      # Shopping list
│   │   └── _wishlist.css      # Wishlist
│   ├── settings/
│   │   └── settings.css       # Settings (profile, security, preferences)
│   ├── support/
│   │   └── support.css        # Support page
│   └── training/
│       └── training.css       # Training (gym and running)
│
└── themes/                    # Layer 5 — Themes
    ├── light-theme.css        # Complete light theme (overrides variables and components)
    ├── tracking-light-theme.css  # Light extension for the training module
    ├── sweet-alert2.css       # SweetAlert2 base styles
    └── sweet-alert-custom.css # SweetAlert2 customizations for SIGP
```

---

### Folder Responsibilities

#### `base/` — Foundation

The most generic layer. Defines the foundation upon which everything else is built.

| File | Responsibility |
|---|---|
| `base.css` | CSS reset, Custom Properties (color tokens, spacing, typography), custom scrollbar, global utility classes. Defines the dark theme as default. |
| `components.css` | Reusable base components: auth containers, buttons (`btn-primary`, `btn-secondary`, `btn-icon`, `btn-google`), inputs, cards, alerts, navigation. ~1,674 lines. |
| `animations.css` | **Single source of truth for animations.** All project `@keyframes`: fade, slide, pulse, float, spin, scale, modal, checkbox-pop, form transitions. Utility classes `.animate-*`. |
| `loader.css` | Full-screen loading overlay with multi-ring spinner, animated success checkmark, and progress bar. Self-contained. |
| `responsive.css` | Media queries organized by breakpoint. **Must be loaded last** (except themes) to ensure correct override behavior. |

#### `components/` — Reusable Elements

Interface components used across multiple contexts.

| File | Responsibility |
|---|---|
| `tabs.css` | Complete multi-tab system: scrollable tab bar, states (active, hover, closing), close/refresh buttons, per-tab content area, empty state. |
| `forms.css` | Authentication form styles (login, register, recovery), animated form transitions, informational notices, theme toggle button. |
| `_hero.css` | Hero sections for internal page headers. |
| `_containers.css` | Standardized containers reusable across modules. |
| `_version.css` | Version badge displayed in the sidebar footer. |

> **Convention:** Files prefixed with `_` are partials — smaller components imported or referenced by others.

#### `layout/` — Global Structure

Defines the macro-level page structure.

| File | Responsibility |
|---|---|
| `dashboard.css` | Complete dashboard layout: fixed sidebar (280px), main content area, header with menu button, tab bar, hero sections, responsive sidebar (fullscreen on mobile). |

#### `modules/` — Feature Styles

Each system feature has its own isolated styles in this folder.

| Folder | Scope |
|---|---|
| `documents/` | Document cards, upload area, drag & drop visuals, empty states |
| `exams/` | Medical exam listings, information cards, status indicators |
| `expenses/` | Financial tables, fixed and credit expense cards, income forms, report charts |
| `personal/` | Personal module subdivided: tasks, links, passwords, shopping, wishlist — with `personal.css` as entry point and `_*.css` partials |
| `settings/` | Settings panel: profile, security, notification preferences, account info cards |
| `support/` | Support page and FAQ |
| `training/` | Gym training (exercises, sets, tracking calendar) and running |

#### `themes/` — Visual Variations

Defines and applies theme variations.

| File | Responsibility |
|---|---|
| `light-theme.css` | Complete light theme. Uses `body.light-theme` selector to override Custom Properties and styles across all components and modules. ~1,992 lines. |
| `tracking-light-theme.css` | Light theme extension specific to the training module (calendar, stats cards). |
| `sweet-alert2.css` | SweetAlert2 base styles integrated into the project. |
| `sweet-alert-custom.css` | SweetAlert2 visual customizations for SIGP design consistency. |

---

### Loading Order

CSS import order is critical for correct cascade behavior:

```html
<!-- 1. Base — Foundation -->
<link rel="stylesheet" href="assets/css/base/base.css">
<link rel="stylesheet" href="assets/css/base/components.css">
<link rel="stylesheet" href="assets/css/base/loader.css">
<link rel="stylesheet" href="assets/css/base/animations.css">

<!-- 2. Layout — Structure -->
<link rel="stylesheet" href="assets/css/layout/dashboard.css">

<!-- 3. Components — Reusable elements -->
<link rel="stylesheet" href="assets/css/components/tabs.css">
<link rel="stylesheet" href="assets/css/components/forms.css">
<link rel="stylesheet" href="assets/css/components/_hero.css">
<link rel="stylesheet" href="assets/css/components/_containers.css">
<link rel="stylesheet" href="assets/css/components/_version.css">

<!-- 4. Modules — Feature styles -->
<link rel="stylesheet" href="assets/css/modules/expenses/finance.css">
<link rel="stylesheet" href="assets/css/modules/personal/personal.css">
<!-- ... remaining modules -->

<!-- 5. Themes — Visual variations -->
<link rel="stylesheet" href="assets/css/themes/light-theme.css">
<link rel="stylesheet" href="assets/css/themes/tracking-light-theme.css">

<!-- 6. Responsive — MUST BE LAST (before alerts) -->
<link rel="stylesheet" href="assets/css/base/responsive.css">

<!-- 7. Custom alerts (SweetAlert2) -->
<link rel="stylesheet" href="assets/css/themes/sweet-alert2.css">
<link rel="stylesheet" href="assets/css/themes/sweet-alert-custom.css">
```

> **Fundamental rule:** `responsive.css` must come after all module and theme styles so that media queries can correctly override any property.

---

### CSS Custom Properties

The project uses CSS Custom Properties (variables) as the design system foundation. All are defined in `base.css`:

```css
:root {
    /* Primary colors (dark theme — default) */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --accent-primary: #3b82f6;
    --accent-hover: #2563eb;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Borders and shadows */
    --border-radius: 8px;
    --border-color: #334155;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
    
    /* Typography */
    --font-family: 'Segoe UI', system-ui, sans-serif;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    
    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
}
```

The light theme overrides these variables via class:

```css
body.light-theme {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    /* ... */
}
```

---

### Mobile-First Strategy

The project adopts a **progressive responsive** approach with breakpoints defined in `responsive.css`:

| Breakpoint | Target | Description |
|---|---|---|
| Base (no query) | Mobile | Default styles optimized for mobile |
| `≤ 390px` | Extra Small | Compact phones (iPhone SE) |
| `≤ 480px` | Small Mobile | Small phones |
| `481px – 576px` | Mobile | Standard phones |
| `577px – 768px` | Tablet | Portrait tablets |
| `> 1024px` | Desktop | Desktops and laptops |

**Responsive characteristics:**
- Sidebar transforms to fullscreen menu on mobile
- Minimum touch area of `44px` on interactive elements
- Prevented zoom on inputs for iOS (`maximum-scale=1.0`)
- `safe-area-inset` support for devices with notch and Dynamic Island
- Horizontally scrollable tabs on smaller screens

---

### Theme System

#### How It Works

1. The dark theme is the **default** — defined in `:root` Custom Properties
2. The light theme is activated by the `body.light-theme` class
3. `ThemeManager.js` manages toggle, persistence, and FOUC prevention
4. Each module can have theme extensions (e.g., `tracking-light-theme.css`)

#### Theme Structure

```css
/* In themes/light-theme.css */

/* 1. Override global Custom Properties */
body.light-theme {
    --bg-primary: #ffffff;
    --text-primary: #1e293b;
    /* ... */
}

/* 2. Component-specific adjustments */
body.light-theme .sidebar { /* ... */ }
body.light-theme .card { /* ... */ }
body.light-theme .btn-primary { /* ... */ }

/* 3. Module-specific adjustments (if needed) */
body.light-theme .expense-card { /* ... */ }
body.light-theme .training-calendar { /* ... */ }
```

---

### Adding a New Module

1. **Create the folder** in `modules/`:
   ```
   modules/my-module/
   └── my-module.css
   ```

2. **Write styles** using existing Custom Properties:
   ```css
   .my-module-container {
       background: var(--bg-secondary);
       color: var(--text-primary);
       border-radius: var(--border-radius);
       padding: var(--spacing-lg);
   }
   
   .my-module-card {
       border: 1px solid var(--border-color);
       box-shadow: var(--shadow-sm);
       transition: var(--transition-normal);
   }
   ```

3. **Add to HTML** in the correct position (before themes and responsive):
   ```html
   <!-- Modules -->
   <link rel="stylesheet" href="assets/css/modules/my-module/my-module.css">
   ```

4. **Add light theme support** in `light-theme.css`:
   ```css
   /* === My Module === */
   body.light-theme .my-module-container { /* ... */ }
   body.light-theme .my-module-card { /* ... */ }
   ```

5. **Add media queries** in `responsive.css`:
   ```css
   /* === My Module — Mobile === */
   @media (max-width: 768px) {
       .my-module-container { /* ... */ }
   }
   ```

---

### Creating a New Theme

1. **Create the file** in `themes/`:
   ```
   themes/my-theme.css
   ```

2. **Define the activation selector**:
   ```css
   body.my-theme {
       /* Override Custom Properties */
       --bg-primary: #1a1a2e;
       --bg-secondary: #16213e;
       --accent-primary: #e94560;
       --text-primary: #eee;
       /* ... all necessary variables */
   }
   ```

3. **Add specific overrides** for components that need fine-tuning:
   ```css
   body.my-theme .sidebar { /* ... */ }
   body.my-theme .btn-primary { /* ... */ }
   ```

4. **Register in** `ThemeManager.js` to include it in the toggle cycle.

5. **Link in HTML** after existing themes:
   ```html
   <link rel="stylesheet" href="assets/css/themes/my-theme.css">
   ```

---

### Best Practices

| Practice | Description |
|---|---|
| **Use Custom Properties** | Always reference variables instead of hardcoded values to maintain consistency and theme support |
| **Prefix by module** | Use prefixes like `.expense-`, `.training-`, `.personal-` to avoid name collisions |
| **No `!important`** | Layer-based specificity makes `!important` unnecessary |
| **Centralized animations** | Define `@keyframes` in `animations.css` — never in module files |
| **Responsive at the end** | Media queries always in `responsive.css`, loaded last |
| **Partials with `_`** | Auxiliary files not directly imported in HTML use the `_` prefix |
| **Avoid inline styles** | Use CSS classes. Inline styles from JS have been refactored into reusable classes |
| **Document sections** | Use `/* === Section === */` comments to delimit blocks inside large files |
| **Minimal selectors** | Prefer a single class (`.card-title`) over compound selectors (`.card > .content > h3`) |
| **Light theme as override** | The light theme overrides the dark one — never duplicate base styles |
