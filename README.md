# SIGP — Sistema Inteligente de Gestão Pessoal

<p align="center">
  <strong>v2.0.0</strong> · Aplicação web modular para gestão pessoal completa
</p>

---

## 🇧🇷 Português

### Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Objetivo](#objetivo)
- [Principais Funcionalidades](#principais-funcionalidades)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Padrões Adotados](#padrões-adotados)
- [Sistema de Temas](#sistema-de-temas)
- [Organização Modular](#organização-modular)
- [Como Rodar o Projeto](#como-rodar-o-projeto)
- [Versionamento](#versionamento)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

### Sobre o Projeto

O **SIGP** (Sistema Inteligente de Gestão Pessoal) é uma aplicação web de página única (SPA) projetada para centralizar e organizar diversos aspectos da vida pessoal do usuário — finanças, tarefas, documentos, treinos, exames médicos, senhas e muito mais.

A aplicação é composta por duas páginas HTML (`index.html` para autenticação e `dashboard.html` para o painel principal), com conteúdo dinâmico carregado por um sistema de abas internas, permitindo múltiplas seções abertas simultaneamente.

---

### Objetivo

Fornecer uma plataforma pessoal, segura e escalável para gestão organizada de dados e atividades do dia a dia, com:

- Acesso rápido e intuitivo via navegador
- Isolamento completo de dados por usuário
- Interface responsiva e adaptável a qualquer dispositivo
- Inteligência artificial para resumos automáticos via e-mail

---

### Principais Funcionalidades

| Módulo | Descrição |
|---|---|
| **Financeiro** | Controle de renda mensal, gastos fixos, despesas com cartão de crédito e relatórios financeiros completos |
| **Anotações Pessoais** | Gerenciamento de anotações, tarefas, links úteis, senhas, lista de compras, lista de desejos e lembretes recorrentes |
| **Documentos** | Upload, organização e reordenação (drag & drop) de documentos pessoais com armazenamento no Firebase Storage |
| **Exames Médicos** | Registro e acompanhamento de exames médicos com histórico |
| **Treinos** | Gestão de treinos de academia (exercícios e séries) e corridas com rastreamento de desempenho |
| **Configurações** | Perfil do usuário, segurança (alteração de senha, vinculação Google), preferências e informações da conta |
| **Suporte** | Canal de comunicação para suporte ao usuário |
| **Digest por IA** | Resumo personalizado enviado por e-mail no login (e sob demanda via "Enviar agora"), gerado por Cloud Functions (OpenAI GPT-4o) e despachado via EmailJS no backend |
| **Temas** | Alternância entre tema claro e escuro com transição suave e persistência local |
| **Sistema de Abas** | Navegação multi-aba dentro do dashboard, com atalhos de teclado (`Ctrl+T`, `Ctrl+W`) |

---

### Arquitetura

A aplicação segue uma arquitetura modular em camadas, com separação clara de responsabilidades:

```
┌──────────────────────────────────────────────┐
│                  HTML Pages                  │
│          index.html │ dashboard.html         │
├──────────────────────────────────────────────┤
│                 Auth Layer                   │
│   LoginHandler · RegisterHandler · Forgot    │
├──────────────────────────────────────────────┤
│               Managers Layer                 │
│  DashboardManager · PageManager · TabManager │
│  UIManager · FormManager · FormStateManager  │
├──────────────────────────────────────────────┤
│              Modules Layer                   │
│  Expenses · Personal · Documents · Exams     │
│  Training · Settings · Support               │
├──────────────────────────────────────────────┤
│              Services Layer                  │
│  UserService · FinanceService · DigestService│
│  PersonalDataService · TrainingService       │
├──────────────────────────────────────────────┤
│                Core Layer                    │
│  firebaseConfig · FirebaseDataService        │
│  firebaseGlobals · EventBus                  │
├──────────────────────────────────────────────┤
│              Utils Layer                     │
│  Logger · Result · DataGuard · DOMUtils      │
│  Validator · HTMLTemplates · ThemeManager    │
└──────────────────────────────────────────────┘
```

**Fluxo de dados:**
1. O usuário se autentica via `index.html` (Auth Layer → UserService → Firebase Auth)
2. O `dashboard.js` inicializa `DashboardManager`, `PageManager` e `TabManager`
3. Navegação acontece via sidebar → `PageManager` carrega o handler do módulo correspondente
4. Cada módulo utiliza seu respectivo **Service** para comunicação com o Firestore
5. Todos os dados são isolados por usuário (path: `/artifacts/{appId}/users/{userId}/...`)

---

### Estrutura de Pastas

```
SIGP_V2/
├── firebase.json              # Configuração do Firebase Hosting
├── bump-version.ps1           # Script PowerShell para versionamento semântico
├── public/                    # Diretório público (servido pelo Firebase Hosting)
│   ├── index.html             # Página de autenticação (login/registro/recuperação)
│   ├── dashboard.html         # Página principal do dashboard
│   ├── version.json           # Metadados de versão e changelog
│   └── assets/
│       ├── css/               # Estilos organizados por camadas
│       │   ├── base/          # Reset, variáveis, componentes base, animações, responsivo
│       │   ├── components/    # Componentes reutilizáveis (tabs, forms, hero, containers)
│       │   ├── layout/        # Layout estrutural (dashboard)
│       │   ├── modules/       # Estilos específicos por funcionalidade
│       │   └── themes/        # Variações de tema (light, sweet-alert)
│       ├── img/               # Imagens e ícones
│       └── js/                # JavaScript organizado por responsabilidade
│           ├── auth/          # Handlers de autenticação
│           ├── core/          # Configuração Firebase, bootstrap, EventBus
│           ├── managers/      # Gerenciadores de estado e interface
│           ├── modules/       # Módulos de funcionalidades específicas
│           ├── services/      # Comunicação com APIs e banco de dados
│           └── utils/         # Funções utilitárias e helpers
```

> Documentação detalhada disponível em:
> - [`assets/css/README.md`](public/assets/css/README.md) — Arquitetura CSS
> - [`assets/js/README.md`](public/assets/js/README.md) — Arquitetura JavaScript

---

### Tecnologias Utilizadas

| Tecnologia | Versão/Uso |
|---|---|
| **HTML5** | Estrutura semântica das páginas |
| **CSS3** | Custom Properties, Flexbox, Grid, Media Queries, `@keyframes` |
| **JavaScript (ES6+)** | Módulos ES (`import`/`export`), classes, `async`/`await`, template literals |
| **Firebase Authentication** | Login por e-mail/senha e Google OAuth |
| **Firebase Firestore** | Banco de dados NoSQL em tempo real |
| **Firebase Storage** | Armazenamento de arquivos (documentos) |
| **Firebase Hosting** | Hospedagem da aplicação |
| **Firebase Functions** | Runtime Node.js 20 (codebase `sigp-assistant`) |
| **SweetAlert2** | Alertas e modais customizados (via CDN) |
| **EmailJS** | Envio de e-mails via Cloud Functions (chave privada como Firebase Secret) |
| **OpenAI GPT-4o** | Geração de resumos inteligentes para o Digest Service (chamado pelas Cloud Functions) |

> **Nota:** O projeto é construído em **JavaScript vanilla** — não utiliza frameworks como React, Vue ou Angular. Toda a reatividade e gerenciamento de estado são implementados nativamente.

---

### Padrões Adotados

| Padrão | Aplicação |
|---|---|
| **Separação de responsabilidades** | Cada camada (auth, core, managers, modules, services, utils) possui escopo bem definido |
| **Módulos ES6** | Core, Services e Auth usam `import`/`export` nativo |
| **Bridge Pattern** | `firebaseGlobals.js` expõe módulos ES6 para scripts clássicos via `window` |
| **Injeção de dependência** | Handlers de autenticação recebem serviços via construtor |
| **Result Monad** | `Result.ok()` / `Result.fail()` para tratamento de erros sem exceções |
| **EventBus (Pub/Sub)** | Barramento de eventos centralizado com nomes de eventos congelados |
| **Singleton** | `EventBus`, `ThemeManager` — instância única global |
| **Cache em memória** | `FinanceService`, `PersonalDataService`, `DOMUtils` mantêm cache local |
| **Lazy initialization** | `PageManager` cria handlers somente na primeira navegação |
| **Template system** | `HTMLTemplates` centraliza geração de HTML para consistência |
| **Defensive programming** | `DataGuard` fornece acesso seguro a propriedades, sanitização HTML e validação de schema |

---

### Sistema de Temas

O SIGP possui um sistema de temas dual (claro/escuro) com as seguintes características:

- **Tema escuro como padrão**, definido via CSS Custom Properties em `base.css`
- **Tema claro** aplicado via classe `body.light-theme` em `light-theme.css`
- **Persistência** via `localStorage` — a preferência é carregada antes do DOM para evitar flash de tema incorreto (FOUC)
- **Transição suave** — alternância sem recarregar a página, com animação CSS
- **Feedback tátil** — botão de alternância com animação visual e suporte a dispositivos touch
- **Meta theme-color** — atualizado dinamicamente para corresponder ao tema ativo
- **Evento customizado** — `themeChanged` é disparado para que módulos possam reagir à troca

Para detalhes sobre como criar novos temas, consulte [`assets/css/README.md`](public/assets/css/README.md).

---

### Organização Modular

Cada funcionalidade do sistema é encapsulada como um módulo independente, seguindo o padrão:

```
modules/{nome-do-modulo}/
├── Base{Modulo}Module.js      # Classe base com operações comuns (CRUD)
├── {SubModulo}Module.js       # Módulos especializados (herança ou composição)
└── {Modulo}PageHandler.js     # Orquestrador: monta HTML, inicializa e gerencia a página
```

**Exemplo — Módulo Financeiro:**
```
modules/expenses/
├── BaseExpenseModule.js       # CRUD genérico de despesas
├── FixedExpensesModule.js     # Contas fixas (com reset mensal automático)
├── CreditExpensesModule.js    # Cartão de crédito (parcelas, valor calculado)
├── ExpensesPageHandler.js     # Orquestra a página de gastos
├── IncomePageHandler.js       # Gerencia renda mensal
└── ReportPageHandler.js       # Relatório financeiro consolidado
```

Para guia completo sobre como adicionar novos módulos, consulte [`assets/js/README.md`](public/assets/js/README.md).

---

### Como Rodar o Projeto

#### Pré-requisitos

- [Firebase CLI](https://firebase.google.com/docs/cli) instalado e configurado
- Projeto Firebase criado com Firestore, Authentication, Storage e Hosting habilitados
- Arquivo `public/assets/js/core/firebase.env.js` com as credenciais do projeto:

```javascript
export const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// A chave da OpenAI NÃO fica no front-end. Configure-a como secret no Cloud Functions:
//   firebase functions:secrets:set OPENAI_API_KEY
//   firebase functions:secrets:set EMAILJS_PRIVATE_KEY
```

#### Rodando localmente

```bash
# 1. Servir localmente via Firebase Emulator
firebase serve --only hosting

# 2. Acessar no navegador
# http://localhost:5000
```

#### Deploy para produção

```bash
firebase deploy --only hosting
```

---

### Versionamento

O projeto utiliza **versionamento semântico** (SemVer) com automação via script PowerShell:

```powershell
# Bump de patch (ex: 2.0.0 → 2.0.1)
.\bump-version.ps1 -Type patch -Message "Descrição da alteração"

# Bump de minor (ex: 2.0.0 → 2.1.0)
.\bump-version.ps1 -Type minor -Message "Nova funcionalidade"

# Bump de major (ex: 2.0.0 → 3.0.0)
.\bump-version.ps1 -Type major -Message "Breaking change"
```

O script atualiza automaticamente:
- O campo `version` em `public/version.json`
- A data de build (`buildDate`)
- O changelog com a nova entrada
- Opcionalmente cria commit git e faz push

O badge de versão é exibido no rodapé da sidebar do dashboard via `VersionManager.js`.

---

### Roadmap

| Prioridade | Feature |
|---|---|
| 🔜 | Modo offline com Service Worker e sincronização |
| 🔜 | Notificações push via Firebase Cloud Messaging |
| 📋 | Exportação de relatórios em PDF |
| 📋 | Dashboard com gráficos e métricas consolidadas |
| 📋 | Módulo de agenda/calendário |
| 💡 | PWA (Progressive Web App) com instalação nativa |
| 💡 | Internacionalização (i18n) |

---

### Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

```
MIT License

Copyright (c) 2026 SIGP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

---

## 🇺🇸 English Version

### Table of Contents

- [About the Project](#about-the-project)
- [Purpose](#purpose)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Technologies Used](#technologies-used)
- [Design Patterns](#design-patterns)
- [Theme System](#theme-system)
- [Modular Organization](#modular-organization)
- [Running the Project](#running-the-project)
- [Versioning](#versioning)
- [Roadmap](#roadmap-1)
- [License](#license-1)

---

### About the Project

**SIGP** (Sistema Inteligente de Gestão Pessoal / Intelligent Personal Management System) is a single-page web application (SPA) designed to centralize and organize various aspects of the user's personal life — finances, tasks, documents, workouts, medical exams, passwords, and more.

The application consists of two HTML pages (`index.html` for authentication and `dashboard.html` for the main panel), with dynamic content loaded by an internal tab system that allows multiple sections to be open simultaneously.

---

### Purpose

Provide a personal, secure, and scalable platform for organized management of daily data and activities, with:

- Quick and intuitive browser access
- Complete per-user data isolation
- Responsive interface adaptable to any device
- Artificial intelligence for automated email summaries

---

### Key Features

| Module | Description |
|---|---|
| **Financial** | Monthly income tracking, fixed expenses, credit card expenses, and comprehensive financial reports |
| **Personal Notes** | Notes, task management, bookmarks, passwords, shopping lists, wishlists, and recurring reminders |
| **Documents** | Upload, organization, and drag & drop reordering of personal documents stored in Firebase Storage |
| **Medical Exams** | Medical exam registration and tracking with history |
| **Training** | Gym workout management (exercises and sets) and running tracking with performance metrics |
| **Settings** | User profile, security (password change, Google linking), preferences, and account information |
| **Support** | User support communication channel |
| **AI Digest** | Personalized summary sent by email on login (and on demand via "Send now"), generated by Cloud Functions (OpenAI GPT-4o) and delivered through EmailJS server-side |
| **Themes** | Smooth-transitioning light/dark theme toggle with local persistence |
| **Tab System** | Multi-tab navigation within the dashboard, with keyboard shortcuts (`Ctrl+T`, `Ctrl+W`) |

---

### Architecture

The application follows a layered modular architecture with clear separation of concerns:

```
┌──────────────────────────────────────────────┐
│                  HTML Pages                  │
│          index.html │ dashboard.html         │
├──────────────────────────────────────────────┤
│                 Auth Layer                   │
│   LoginHandler · RegisterHandler · Forgot    │
├──────────────────────────────────────────────┤
│               Managers Layer                 │
│  DashboardManager · PageManager · TabManager │
│  UIManager · FormManager · FormStateManager  │
├──────────────────────────────────────────────┤
│              Modules Layer                   │
│  Expenses · Personal · Documents · Exams     │
│  Training · Settings · Support               │
├──────────────────────────────────────────────┤
│              Services Layer                  │
│  UserService · FinanceService · DigestService│
│  PersonalDataService · TrainingService       │
├──────────────────────────────────────────────┤
│                Core Layer                    │
│  firebaseConfig · FirebaseDataService        │
│  firebaseGlobals · EventBus                  │
├──────────────────────────────────────────────┤
│              Utils Layer                     │
│  Logger · Result · DataGuard · DOMUtils      │
│  Validator · HTMLTemplates · ThemeManager    │
└──────────────────────────────────────────────┘
```

**Data flow:**
1. User authenticates via `index.html` (Auth Layer → UserService → Firebase Auth)
2. `dashboard.js` initializes `DashboardManager`, `PageManager`, and `TabManager`
3. Navigation occurs via sidebar → `PageManager` loads the corresponding module handler
4. Each module uses its respective **Service** for Firestore communication
5. All data is isolated per user (path: `/artifacts/{appId}/users/{userId}/...`)

---

### Folder Structure

```
SIGP_V2/
├── firebase.json              # Firebase Hosting configuration
├── bump-version.ps1           # PowerShell script for semantic versioning
├── public/                    # Public directory (served by Firebase Hosting)
│   ├── index.html             # Authentication page (login/register/recovery)
│   ├── dashboard.html         # Main dashboard page
│   ├── version.json           # Version metadata and changelog
│   └── assets/
│       ├── css/               # Styles organized by layers
│       │   ├── base/          # Reset, variables, base components, animations, responsive
│       │   ├── components/    # Reusable components (tabs, forms, hero, containers)
│       │   ├── layout/        # Structural layout (dashboard)
│       │   ├── modules/       # Feature-specific styles
│       │   └── themes/        # Theme variations (light, sweet-alert)
│       ├── img/               # Images and icons
│       └── js/                # JavaScript organized by responsibility
│           ├── auth/          # Authentication handlers
│           ├── core/          # Firebase setup, bootstrap, EventBus
│           ├── managers/      # State and UI managers
│           ├── modules/       # Feature-specific modules
│           ├── services/      # API and database communication
│           └── utils/         # Utility functions and helpers
```

> Detailed documentation available at:
> - [`assets/css/README.md`](public/assets/css/README.md) — CSS Architecture
> - [`assets/js/README.md`](public/assets/js/README.md) — JavaScript Architecture

---

### Technologies Used

| Technology | Version/Usage |
|---|---|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom Properties, Flexbox, Grid, Media Queries, `@keyframes` |
| **JavaScript (ES6+)** | ES Modules (`import`/`export`), classes, `async`/`await`, template literals |
| **Firebase Authentication** | Email/password and Google OAuth sign-in |
| **Firebase Firestore** | Real-time NoSQL cloud database |
| **Firebase Storage** | File storage (documents) |
| **Firebase Hosting** | Application hosting |
| **Firebase Functions** | Node.js 20 runtime (codebase `sigp-assistant`) |
| **SweetAlert2** | Custom alerts and modals (via CDN) |
| **EmailJS** | Email delivery via Cloud Functions (private key as Firebase Secret) |
| **OpenAI GPT-4o** | Intelligent summary generation for the Digest Service |

> **Note:** The project is built with **vanilla JavaScript** — no frameworks like React, Vue, or Angular are used. All reactivity and state management are natively implemented.

---

### Design Patterns

| Pattern | Usage |
|---|---|
| **Separation of concerns** | Each layer (auth, core, managers, modules, services, utils) has a well-defined scope |
| **ES6 Modules** | Core, Services, and Auth use native `import`/`export` |
| **Bridge Pattern** | `firebaseGlobals.js` exposes ES6 modules to classic scripts via `window` |
| **Dependency injection** | Auth handlers receive services via constructor |
| **Result Monad** | `Result.ok()` / `Result.fail()` for exception-free error handling |
| **EventBus (Pub/Sub)** | Centralized event bus with frozen event names |
| **Singleton** | `EventBus`, `ThemeManager` — single global instance |
| **In-memory caching** | `FinanceService`, `PersonalDataService`, `DOMUtils` maintain local cache |
| **Lazy initialization** | `PageManager` creates handlers only on first navigation |
| **Template system** | `HTMLTemplates` centralizes HTML generation for consistency |
| **Defensive programming** | `DataGuard` provides safe property access, HTML sanitization, and schema validation |

---

### Theme System

SIGP features a dual theme system (light/dark) with the following characteristics:

- **Dark theme as default**, defined via CSS Custom Properties in `base.css`
- **Light theme** applied via `body.light-theme` class in `light-theme.css`
- **Persistence** via `localStorage` — preference is loaded before DOM to prevent incorrect theme flash (FOUC)
- **Smooth transition** — toggle without page reload, with CSS animation
- **Tactile feedback** — toggle button with visual animation and touch device support
- **Dynamic meta theme-color** — updated to match the active theme
- **Custom event** — `themeChanged` is dispatched so modules can react to theme changes

For details on creating new themes, see [`assets/css/README.md`](public/assets/css/README.md).

---

### Modular Organization

Each system feature is encapsulated as an independent module, following the pattern:

```
modules/{module-name}/
├── Base{Module}Module.js      # Base class with common operations (CRUD)
├── {SubModule}Module.js       # Specialized modules (inheritance or composition)
└── {Module}PageHandler.js     # Orchestrator: builds HTML, initializes, and manages the page
```

**Example — Financial Module:**
```
modules/expenses/
├── BaseExpenseModule.js       # Generic expense CRUD
├── FixedExpensesModule.js     # Fixed bills (with automatic monthly reset)
├── CreditExpensesModule.js    # Credit card (installments, calculated value)
├── ExpensesPageHandler.js     # Expenses page orchestrator
├── IncomePageHandler.js       # Monthly income manager
└── ReportPageHandler.js       # Consolidated financial report
```

For a complete guide on adding new modules, see [`assets/js/README.md`](public/assets/js/README.md).

---

### Running the Project

#### Prerequisites

- [Firebase CLI](https://firebase.google.com/docs/cli) installed and configured
- Firebase project created with Firestore, Authentication, Storage, and Hosting enabled
- `public/assets/js/core/firebase.env.js` file with project credentials:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// The OpenAI key does NOT live in the front-end. Configure it as a Cloud
// Functions secret:
//   firebase functions:secrets:set OPENAI_API_KEY
//   firebase functions:secrets:set EMAILJS_PRIVATE_KEY
```

#### Running locally

```bash
# 1. Serve locally via Firebase Emulator
firebase serve --only hosting

# 2. Open in browser
# http://localhost:5000
```

#### Production deployment

```bash
firebase deploy --only hosting
```

---

### Versioning

The project uses **semantic versioning** (SemVer) with automation via PowerShell script:

```powershell
# Patch bump (e.g., 2.0.0 → 2.0.1)
.\bump-version.ps1 -Type patch -Message "Change description"

# Minor bump (e.g., 2.0.0 → 2.1.0)
.\bump-version.ps1 -Type minor -Message "New feature"

# Major bump (e.g., 2.0.0 → 3.0.0)
.\bump-version.ps1 -Type major -Message "Breaking change"
```

The script automatically updates:
- The `version` field in `public/version.json`
- The build date (`buildDate`)
- The changelog with the new entry
- Optionally creates a git commit and pushes

The version badge is displayed in the dashboard sidebar footer via `VersionManager.js`.

---

### Roadmap

| Priority | Feature |
|---|---|
| 🔜 | Offline mode with Service Worker and synchronization |
| 🔜 | Push notifications via Firebase Cloud Messaging |
| 📋 | PDF report export |
| 📋 | Dashboard with charts and consolidated metrics |
| 📋 | Calendar/agenda module |
| 💡 | PWA (Progressive Web App) with native installation |
| 💡 | Internationalization (i18n) |

---

### License

This project is licensed under the [MIT License](LICENSE).
