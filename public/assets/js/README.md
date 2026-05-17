# Arquitetura JavaScript — SIGP

Documentação da estrutura e organização do JavaScript do projeto SIGP.

---

## 🇧🇷 Português

### Índice

- [Visão Geral](#visão-geral)
- [Estrutura por Responsabilidade](#estrutura-por-responsabilidade)
- [Detalhamento de Cada Camada](#detalhamento-de-cada-camada)
- [Padrão Arquitetural](#padrão-arquitetural)
- [Fluxo Geral da Aplicação](#fluxo-geral-da-aplicação)
- [Tipos de Script](#tipos-de-script)
- [Como Adicionar um Novo Módulo](#como-adicionar-um-novo-módulo)
- [Como Integrar uma Nova Feature](#como-integrar-uma-nova-feature)
- [Escalabilidade](#escalabilidade)
- [Padrões e Convenções](#padrões-e-convenções)

---

### Visão Geral

O JavaScript do SIGP está organizado por **responsabilidade**, com separação clara entre camadas. A aplicação é construída inteiramente em **JavaScript vanilla (ES6+)**, sem frameworks, utilizando uma combinação de:

- **ES Modules** (`import`/`export`) — para core, services e auth
- **Scripts clássicos** — para managers, utils e modules (expostos via `window`)
- **Bridge pattern** — `firebaseGlobals.js` conecta os dois mundos

Essa abordagem permite manter a simplicidade do vanilla JS enquanto se beneficia de módulos nativos para as camadas que exigem melhor encapsulamento.

---

### Estrutura por Responsabilidade

```
js/
├── auth/                      # Autenticação
│   ├── LoginHandler.js        # Login (usuário/senha + Google OAuth)
│   ├── RegisterHandler.js     # Registro (formulário + Google)
│   └── ForgotPasswordHandler.js  # Recuperação de senha
│
├── core/                      # Bootstrap e Infraestrutura
│   ├── app.js                 # Entry point da página de autenticação
│   ├── firebaseConfig.js      # Inicialização Firebase + re-export de métodos
│   ├── firebaseDataService.js # CRUD genérico para Firestore
│   ├── firebaseGlobals.js     # Bridge: módulos ES6 → window (scripts clássicos)
│   ├── firebase.env.js        # Credenciais Firebase e OpenAI (não versionado)
│   ├── emailjsInit.js         # Inicialização do EmailJS
│   └── EventBus.js            # Barramento de eventos pub/sub centralizado
│
├── managers/                  # Gerenciamento de Estado e Interface
│   ├── dashboard.js           # Entry point da página do dashboard
│   ├── DashboardManager.js    # Shell do dashboard (auth, sidebar, navegação)
│   ├── PageManager.js         # Router — mapeia nomes de página para handlers
│   ├── TabManager.js          # Sistema multi-aba (Ctrl+T, Ctrl+W)
│   ├── UIManager.js           # Toasts, loading de botão, erros de campo
│   ├── FormManager.js         # Transições animadas entre formulários de auth
│   ├── FormStateManager.js    # Preservação de estado de formulário entre abas
│   └── LoadingManager.js      # Overlay de loading full-screen
│
├── modules/                   # Funcionalidades Específicas
│   ├── documents/
│   │   └── DocumentsPageHandler.js
│   ├── exams/
│   │   └── ExamsPageHandler.js
│   ├── expenses/
│   │   ├── BaseExpenseModule.js
│   │   ├── FixedExpensesModule.js
│   │   ├── CreditExpensesModule.js
│   │   ├── ExpensesPageHandler.js
│   │   ├── IncomePageHandler.js
│   │   └── ReportPageHandler.js
│   ├── personal/
│   │   ├── BasePersonalModule.js
│   │   ├── NotesModule.js
│   │   ├── TasksModule.js
│   │   ├── LinksModule.js
│   │   ├── PasswordsModule.js
│   │   ├── ShoppingModule.js
│   │   ├── WishlistModule.js
│   │   ├── RemindersModule.js
│   │   └── PersonalPageHandler.js
│   ├── settings/
│   │   ├── BaseSettingsModule.js
│   │   ├── ProfileModule.js
│   │   ├── SecurityModule.js
│   │   ├── PreferencesModule.js
│   │   ├── AccountInfoModule.js
│   │   └── SettingsPageHandler.js
│   ├── support/
│   │   └── SupportPageHandler.js
│   └── training/
│       ├── BaseTrainingModule.js
│       ├── WorkoutModule.js
│       ├── RunningModule.js
│       └── TrainingPageHandler.js
│
├── services/                  # Comunicação Externa
│   ├── UserService.js         # Auth + perfis de usuário (Firebase Auth + Firestore)
│   ├── FinanceService.js      # CRUD de renda, gastos fixos e cartão de crédito
│   ├── PersonalDataService.js # CRUD unificado: tarefas, links, senhas, compras, wishlist
│   ├── TrainingService.js     # CRUD de treinos (academia e corrida)
│   └── DigestService.js       # Resumos por IA (OpenAI GPT-4o + EmailJS)
│
└── utils/                     # Funções Utilitárias
    ├── Logger.js              # Console wrapper com flag de debug
    ├── Result.js              # Result monad (ok/fail) para tratamento de erros
    ├── DataGuard.js           # Acesso seguro a propriedades, sanitização HTML, validação
    ├── DOMUtils.js            # Helpers DOM com cache de elementos
    ├── FormUtils.js           # Máscaras de input + sessionStorage wrapper
    ├── HTMLTemplates.js       # Sistema centralizado de templates HTML
    ├── Validator.js           # Validações de input (e-mail, senha, telefone, username)
    ├── AuthErrorMapper.js     # Firebase Auth error codes → mensagens em português
    ├── ThemeManager.js        # Alternância e persistência de tema (claro/escuro)
    └── VersionManager.js      # Badge de versão + modal de changelog
```

---

### Detalhamento de Cada Camada

#### `auth/` — Autenticação

Handlers para as três ações de autenticação da aplicação. Todos utilizam **injeção de dependência** via construtor.

| Arquivo | Responsabilidade |
|---|---|
| `LoginHandler.js` | Login via usuário/senha (busca por username → autenticação por e-mail) e Google OAuth. Gerencia estados de loading, erros e redirecionamento. Suporte a `touchend` para iOS. |
| `RegisterHandler.js` | Registro em dois modos: formulário (e-mail/senha) ou Google. UI em duas etapas: seleção de método → preenchimento de campos. Validação via `Validator`. |
| `ForgotPasswordHandler.js` | Recuperação de senha via Firebase `sendPasswordResetEmail`. Busca e-mail pelo username e retorna automaticamente ao login após 5 segundos. |

**Padrão:**
```javascript
class LoginHandler {
    constructor(userService, uiManager, loadingManager) {
        this.userService = userService;     // Injeção de dependência
        this.uiManager = uiManager;
        this.loadingManager = loadingManager;
        this.init();
    }
}
```

#### `core/` — Bootstrap e Infraestrutura

Camada de inicialização e infraestrutura fundamental.

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `app.js` | ES Module | Entry point de `index.html`. Cria serviços e inicializa auth handlers. |
| `dashboard.js` (em managers/) | ES Module | Entry point de `dashboard.html`. Aguarda `onAuthStateChanged`, inicializa managers e dispara `DigestService`. |
| `firebaseConfig.js` | ES Module | Inicializa Firebase SDK v11.6.1 (app, auth, firestore, storage). Re-exporta todas as funções Firebase para consumo por outros módulos. |
| `firebaseDataService.js` | ES Module | Classe estática com CRUD genérico Firestore. Path: `/artifacts/{appId}/users/{userId}/{collection}`. `removeUndefinedFields()` para limpeza recursiva de dados. Real-time via `onSnapshot`. |
| `firebaseGlobals.js` | ES Module | **Bridge pattern** — importa tudo de `firebaseConfig.js` + `FirebaseDataService` e expõe em `window.firebaseGlobals` para scripts clássicos. |
| `firebase.env.js` | ES Module | Credenciais Firebase e chave OpenAI. **Deve estar no `.gitignore`**. |
| `emailjsInit.js` | Script | Inicialização do serviço EmailJS (usado pelo DigestService). |
| `EventBus.js` | Script | Singleton pub/sub com métodos `on`, `once`, `off`, `emit`, `emitAsync`. Eventos tipados e congelados (`Object.freeze`). Exposto via `window.EventBus`. |

#### `managers/` — Gerenciamento de Estado e Interface

Classes responsáveis por orquestrar a interface e gerenciar estados.

| Arquivo | Responsabilidade |
|---|---|
| `DashboardManager.js` | Shell do dashboard: verifica autenticação, popula sidebar (dados do usuário, navegação com pastas expansíveis), gerencia toggle do sidebar, logout com SweetAlert2. |
| `PageManager.js` | **Router central.** Mapa de rotas: `{'gastos' → renderExpenses(), 'treinos' → renderTraining(), ...}`. Lazy-creates handlers na primeira navegação. Instancia Services uma vez e os repassa aos handlers. 12 rotas, ~578 linhas. |
| `TabManager.js` | Sistema multi-aba estilo browser. Cria/alterna/fecha abas. Cada aba possui seu próprio container de conteúdo. Atalhos: `Ctrl+T` (nova aba), `Ctrl+W` (fechar aba). Usa `FormStateManager` para preservar estados entre abas. Evita duplicação de abas. ~597 linhas. |
| `UIManager.js` | Classe totalmente estática. Toasts (`showMessage`), loading state em botões (`toggleButtonLoading`), erros inline em campos (`showFieldError`, `clearFormErrors`). |
| `FormManager.js` | Transições CSS animadas entre formulários de autenticação (login ↔ registro ↔ recuperação). |
| `FormStateManager.js` | Preserva e restaura estado completo de formulários ao alternar abas: valores de inputs, visibilidade de seções, estado de edição. ~400 linhas com métodos granulares (SRP). |
| `LoadingManager.js` | Overlay full-screen: spinner multi-anel → checkmark animado → progresso → fade out. API: `show()`, `showSuccess()`, `hide()`, `showSequence()`. |

#### `modules/` — Funcionalidades Específicas

Cada módulo segue o padrão consistente de **Base + Especialização + Handler**:

```
modules/{modulo}/
├── Base{Modulo}Module.js       # Classe base com CRUD genérico
├── {Sub}Module.js              # Módulos especializados (herdam ou compõem)
└── {Modulo}PageHandler.js      # Orquestrador da página
```

| Módulo | Arquivos | Descrição |
|---|---|---|
| **expenses** | 6 arquivos | `BaseExpenseModule` → `FixedExpensesModule`, `CreditExpensesModule`. `IncomePageHandler`, `ExpensesPageHandler`, `ReportPageHandler` orquestram páginas. Cartão de crédito calcula `installmentValue` e `endDate`. Contas fixas resetam automaticamente no dia 1. |
| **personal** | 9 arquivos | `BasePersonalModule` → `NotesModule`, `TasksModule`, `LinksModule`, `PasswordsModule`, `ShoppingModule`, `WishlistModule`, `RemindersModule`. `PersonalPageHandler` gerencia abas internas do módulo pessoal. |
| **training** | 4 arquivos | `BaseTrainingModule` → `WorkoutModule` (exercícios e séries), `RunningModule` (corridas). `TrainingPageHandler` orquestra. Usa `TrainingService` (script clássico via `window.firebaseGlobals`). |
| **settings** | 6 arquivos | `BaseSettingsModule` → `ProfileModule`, `SecurityModule` (alteração de senha, vinculação Google), `PreferencesModule` (digest/notificações), `AccountInfoModule`. `SettingsPageHandler` orquestra. |
| **documents** | 1 arquivo | `DocumentsPageHandler` — upload, listagem, reordenação drag & drop com persistência no Firestore. |
| **exams** | 1 arquivo | `ExamsPageHandler` — registro e listagem de exames médicos. |
| **support** | 1 arquivo | `SupportPageHandler` — página de suporte. |

#### `services/` — Comunicação Externa

Camada de serviços que abstrai a comunicação com Firebase e APIs externas.

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `UserService.js` | ES Module | Firebase Auth: criação de conta, login (e-mail/senha + Google), recuperação de senha. Geração sequencial de usernames (`SIGP000`, `SIGP001`...). Gerenciamento de perfis no Firestore. Detecção e merge de conflitos de conta Google. ~914 linhas. |
| `FinanceService.js` | ES Module | CRUD para renda (doc único `userIncome`), gastos fixos e cartão de crédito. Cache em memória com flags `loaded`. Cálculo automático de parcelas e valor por parcela. Reset mensal de status de pagamento. ~764 linhas. |
| `PersonalDataService.js` | ES Module | Interface unificada para 7 sub-módulos (notes, tasks, links, passwords, shopping, wishlist, reminders): `getAll(module)`, `add(module, data)`, `update(module, id, data)`, `delete(module, id)`. Despacha para métodos privados por módulo. Cache em memória. ~760 linhas. |
| `TrainingService.js` | Script clássico | CRUD para treinos de academia e corrida. Usa `window.firebaseGlobals` para acessar Firebase. Inicialização lazy com retry. Collection: `training-{moduleName}`. ~504 linhas. |
| `DigestService.js` | ES Module | Cliente fino das Cloud Functions: invoca a callable `sendDigestOnLogin` logo após o login (quando o usuário tem o digest ativo) e `sendDigestNow` no botão "Enviar agora". Também carrega/salva as preferências em `artifacts/{appId}/users/{uid}/notifications/preferences`. Toda a chamada à OpenAI e ao EmailJS acontece no backend. ~135 linhas. |

#### `utils/` — Funções Utilitárias

Classes estáticas e helpers reutilizáveis em toda a aplicação.

| Arquivo | Escopo Global | Responsabilidade |
|---|---|---|
| `Logger.js` | `window.Logger` | Console wrapper controlado por flag `DEBUG`. Métodos: `log`, `warn`, `error`, `info` — todos no-ops quando `DEBUG=false`. |
| `Result.js` | `window.Result` | **Result monad** para fluxos sem exceções. `Result.ok(data)` / `Result.fail(error)`. Métodos: `unwrap()`, `unwrapOr(default)`, `map(fn)`. |
| `DataGuard.js` | `window.DataGuard` | Acesso defensivo a propriedades: `get(obj, 'path.to.prop', default)`. Especializações tipadas: `getString`, `getNumber`, `getArray`. `escapeHtml()` para prevenção de XSS. `validateDoc(doc, schema)` para limpeza baseada em schema. |
| `DOMUtils.js` | `window.DOMUtils` | Helpers DOM com cache via `Map`. `getById`, `getInputValue`, `show/hide/toggle`, `addClass/removeClass`, `addListener` (com auto-cleanup). `debounce`, `throttle`, `nextFrame`. |
| `FormUtils.js` | `window.FormUtils` | Máscara de telefone brasileiro (`applyPhoneMask`). Wrappers de `sessionStorage`: `getCurrentUser()`, `setCurrentUser()`, `clearCurrentUser()`. |
| `HTMLTemplates.js` | `window.HTMLTemplates` | Objeto literal com templates organizados por namespace: `icons` (SVGs), `buttons` (edit/delete/markPaid), `cards` (expense, fixed, credit), `forms` (wrapper, inputGroup, selectGroup), `states` (empty, loading, error), `lists` (wrapper, render). ~518 linhas. |
| `Validator.js` | `window.Validator` | Validações: `validateRequired`, `validateEmail`, `validatePasswordLength`, `validatePasswordMatch`, `validatePasswordStrength`, `validateUsername`, `validatePhone`. |
| `AuthErrorMapper.js` | `window.AuthErrorMapper` | Três tabelas de lookup: `AUTH_ERROR_MESSAGES` (geral), `CONTEXT_OVERRIDES` (login/register/reset), `DEFAULT_MESSAGES` (fallback). `getMessage(error, context)` resolve por prioridade. |
| `ThemeManager.js` | `window.ThemeManager` | Singleton auto-instanciado. `loadSavedTheme()` executa antes do DOM (previne FOUC). `toggleTheme()` alterna classes, atualiza `meta[theme-color]`, dispara `CustomEvent('themeChanged')`. Persiste em `localStorage`. |
| `VersionManager.js` | — | Carrega `version.json`, renderiza badge de versão na sidebar. `showChangelog()` abre modal SweetAlert2 com histórico de versões. ~254 linhas. |

---

### Padrão Arquitetural

A aplicação adota uma **arquitetura em camadas com orquestração centralizada**:

```
┌─────────────────────────────────────────────────────┐
│                    HTML Pages                       │
│          (entry points estáticos)                   │
├───────────┬─────────────────────────┬───────────────┤
│  app.js   │     dashboard.js        │  (bootstrap)  │
├───────────┴─────────────────────────┴───────────────┤
│                Manager Layer                        │
│  PageManager (router) → cria handlers on-demand     │
│  TabManager → gerencia contextos paralelos          │
│  DashboardManager → shell e autenticação            │
├─────────────────────────────────────────────────────┤
│                Module Layer                         │
│  PageHandler → orquestra HTML + sub-módulos         │
│  BaseModule → CRUD genérico                         │
│  SubModule → lógica especializada                   │
├─────────────────────────────────────────────────────┤
│                Service Layer                        │
│  Abstrai Firebase/APIs. Cache. Regras de negócio.   │
├─────────────────────────────────────────────────────┤
│                Core Layer                           │
│  Firebase SDK, Firestore genérico, EventBus         │
├─────────────────────────────────────────────────────┤
│                Utils Layer                          │
│  Funções puras, helpers, validação, sanitização     │
└─────────────────────────────────────────────────────┘
```

**Princípios:**
1. **Fluxo unidirecional** — dados descem de Services para Modules, eventos sobem via callbacks ou EventBus
2. **Lazy initialization** — handlers e serviços são criados somente quando necessários
3. **Isolamento de dados** — cada usuário tem seu próprio namespace no Firestore
4. **Cache first** — Services mantêm cache em memória, evitando reads desnecessários
5. **Fail-safe** — `Result` monad e `DataGuard` previnem falhas silenciosas

---

### Fluxo Geral da Aplicação

#### Página de Autenticação (`index.html`)

```
1. index.html carrega scripts
2. app.js (entry point ES Module):
   ├── Cria UserService (Firebase Auth + Firestore)
   ├── Cria UIManager, LoadingManager, FormManager
   ├── Cria LoginHandler (com DI)
   ├── Cria RegisterHandler (com DI)
   └── Cria ForgotPasswordHandler (com DI)
3. Usuário preenche formulário
4. Handler valida → chama UserService → Firebase Auth
5. Sucesso → sessionStorage.setUser() → redirect para dashboard.html
```

#### Dashboard (`dashboard.html`)

```
1. dashboard.html carrega scripts (ES modules + clássicos)
2. ThemeManager.loadSavedTheme() — antes do DOM (previne flash)
3. dashboard.js (entry point ES Module):
   ├── onAuthStateChanged → verifica autenticação
   ├── Cria DashboardManager (sidebar, nav, logout)
   ├── Cria PageManager (router, instancia Services)
   ├── Cria TabManager (abas, delegação para PageManager)
   └── DigestService.checkAndSend() (resumo por IA)
4. Usuário clica em item do menu
5. DashboardManager → TabManager.openTab(pageName)
6. TabManager → PageManager.loadPage(pageName, container)
7. PageManager:
   ├── Lazy-create do handler correspondente
   ├── Handler recebe Service(s) via construtor
   └── Handler renderiza HTML + inicializa interações
8. Interações → Handler → Service → FirebaseDataService → Firestore
```

---

### Tipos de Script

O projeto usa dois tipos de carregamento, conectados por um bridge:

| Tipo | Exemplo | Escopo | Como acessar |
|---|---|---|---|
| **ES Module** | `<script type="module" src="...">` | Escopo fechado (`import`/`export`) | Via `import` direto |
| **Script clássico** | `<script src="...">` | Escopo global (`window.*`) | Via `window.NomeClasse` |
| **Bridge** | `firebaseGlobals.js` | Expõe ES modules no `window` | Via `window.firebaseGlobals` |

**Regra geral:**
- **Core, Services, Auth** → ES Modules (melhor encapsulamento)
- **Managers, Utils, Modules** → Scripts clássicos (acesso direto entre si)
- **Comunicação entre mundos** → `firebaseGlobals.js` (bridge)

---

### Como Adicionar um Novo Módulo

#### 1. Criar os arquivos do módulo

```
modules/meu-modulo/
├── BaseMeuModuloModule.js     # (Opcional) Classe base se houver sub-módulos
├── MeuModuloPageHandler.js    # Orquestrador obrigatório
└── SubModuloModule.js         # (Opcional) Sub-módulos especializados
```

#### 2. Criar o PageHandler

```javascript
class MeuModuloPageHandler {
    constructor(service) {
        this.service = service;  // Recebe service via DI
        this.container = null;
    }

    /**
     * Renderiza o HTML da página.
     * Chamado pelo PageManager.
     */
    renderPage(container) {
        this.container = container;
        container.innerHTML = `
            <div class="hero-section">
                <h2>Meu Módulo</h2>
            </div>
            <div class="meu-modulo-container">
                <!-- Conteúdo -->
            </div>
        `;
        this.init();
    }

    /**
     * Inicializa listeners e carrega dados.
     */
    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        const result = await this.service.getAll();
        if (result.ok) {
            this.renderItems(result.data);
        }
    }

    setupEventListeners() {
        // Bind de eventos
    }

    renderItems(items) {
        // Renderizar lista de itens
    }
}
```

#### 3. Registrar no PageManager

Em `PageManager.js`, adicionar a rota:

```javascript
// No construtor, adicionar ao mapa de páginas:
this.pages = {
    // ... rotas existentes
    'meu-modulo': (container) => this.renderMeuModulo(container),
};

// Criar o método de renderização:
async renderMeuModulo(container) {
    if (!this.meuModuloHandler) {
        this.meuModuloHandler = new MeuModuloPageHandler(this.meuService);
    }
    this.meuModuloHandler.renderPage(container);
}
```

#### 4. Adicionar navegação no `dashboard.html`

```html
<!-- Na sidebar -->
<a href="#" class="nav-item" data-page="meu-modulo">
    <span class="nav-icon">📦</span>
    <span class="nav-text">Meu Módulo</span>
</a>
```

#### 5. Incluir scripts no `dashboard.html`

```html
<!-- Meu Módulo -->
<script src="assets/js/modules/meu-modulo/MeuModuloPageHandler.js"></script>
```

#### 6. Criar CSS correspondente

Seguir o guia em [`assets/css/README.md`](../css/README.md).

---

### Como Integrar uma Nova Feature

#### Novo Service (comunicação com Firebase)

```javascript
// services/MeuService.js (ES Module)
import { FirebaseDataService } from '../core/firebaseDataService.js';

export class MeuService {
    constructor() {
        this.cache = [];
        this.loaded = false;
    }

    async getAll(userId) {
        if (this.loaded) return Result.ok(this.cache);
        
        const result = await FirebaseDataService.getCollectionDocuments(
            userId, 'minha-colecao'
        );
        
        if (result) {
            this.cache = result;
            this.loaded = true;
            return Result.ok(this.cache);
        }
        return Result.fail('Erro ao carregar dados');
    }

    async add(userId, data) {
        const cleaned = DataGuard.validateDoc(data, this.schema);
        return await FirebaseDataService.saveDocument(
            userId, 'minha-colecao', cleaned
        );
    }

    invalidateCache() {
        this.cache = [];
        this.loaded = false;
    }
}
```

#### Novo Util (função auxiliar reutilizável)

```javascript
// utils/MeuUtil.js
class MeuUtil {
    static minhaFuncao(param) {
        // Implementação
    }
}

// Expor globalmente
window.MeuUtil = MeuUtil;
```

---

### Escalabilidade

A arquitetura do SIGP foi projetada para crescer de forma previsível:

| Aspecto | Como escala |
|---|---|
| **Novos módulos** | Criar pasta em `modules/`, registrar rota em `PageManager`, adicionar nav no HTML |
| **Novos services** | Criar em `services/`, importar no `PageManager`, injetar nos handlers |
| **Novos utils** | Criar em `utils/`, expor em `window`, incluir no HTML |
| **Novas abas no módulo** | Adicionar ao `PageHandler` existente (usa `TabManager` internamente) |
| **Novos sub-módulos** | Herdar de `Base*Module`, registrar no `PageHandler` correspondente |
| **Novos temas** | Criar CSS, registrar no `ThemeManager` |
| **Novas validações** | Adicionar métodos em `Validator.js` |
| **Novos templates** | Adicionar namespaces em `HTMLTemplates.js` |
| **Novos eventos** | Registrar no objeto `Events` do `EventBus.js` |

**Pontos de extensão:**
- `PageManager.pages` — mapa central de rotas
- `HTMLTemplates.*` — templates reutilizáveis
- `Events` — constantes tipadas de eventos
- `DataGuard.validateDoc()` — schemas de validação
- `AuthErrorMapper.AUTH_ERROR_MESSAGES` — mapeamento de erros

---

### Padrões e Convenções

#### Nomenclatura

| Tipo | Padrão | Exemplo |
|---|---|---|
| Classe | PascalCase | `ExpensesPageHandler`, `FinanceService` |
| Arquivo | PascalCase (match classe) | `ExpensesPageHandler.js` |
| Método | camelCase | `renderPage()`, `loadData()` |
| Constante | UPPER_SNAKE_CASE | `AUTH_ERROR_MESSAGES`, `DEBUG` |
| Variável privada | camelCase (sem prefixo) | `this.cache`, `this.loaded` |
| Evento | PascalCase com `:` | `Module:loaded`, `Data:updated` |

#### Padrões de Design

| Padrão | Implementação |
|---|---|
| **Injeção de dependência** | Handlers recebem Services via construtor |
| **Result monad** | `Result.ok(data)` / `Result.fail(error)` — sem try/catch em fluxos normais |
| **Singleton** | `EventBus`, `ThemeManager` — instância única no `window` |
| **Static utility** | `UIManager`, `Logger`, `DataGuard`, `DOMUtils`, `Validator` — todos os métodos estáticos |
| **Bridge** | `firebaseGlobals.js` conecta ES modules a scripts clássicos |
| **Cache-first** | Services carregam do Firestore uma vez, depois servem da memória |
| **Lazy creation** | `PageManager` instancia handlers somente no primeiro acesso |
| **Template method** | `Base*Module` define interface CRUD, sub-classes especializam |
| **Defensive access** | `DataGuard.get(obj, 'deep.path', fallback)` em vez de `obj.deep.path` |

#### Boas Práticas

- Usar `Result` para operações que podem falhar
- Usar `DataGuard` para acesso a dados externos (Firebase responses)
- Usar `HTMLTemplates` para gerar HTML programaticamente
- Usar `Logger` em vez de `console.log` direto
- Validar inputs com `Validator` antes de enviar ao Service
- Sanitizar output com `DataGuard.escapeHtml()` para prevenir XSS
- Manter Services com cache e flags `loaded` para performance
- Documentar métodos públicos com JSDoc

---

---

## 🇺🇸 English Version

### Table of Contents

- [Overview](#overview)
- [Structure by Responsibility](#structure-by-responsibility)
- [Layer Details](#layer-details)
- [Architectural Pattern](#architectural-pattern)
- [Application Flow](#application-flow)
- [Script Types](#script-types)
- [Adding a New Module](#adding-a-new-module)
- [Integrating a New Feature](#integrating-a-new-feature)
- [Scalability](#scalability)
- [Patterns and Conventions](#patterns-and-conventions)

---

### Overview

The SIGP JavaScript codebase is organized by **responsibility**, with clear separation between layers. The application is built entirely in **vanilla JavaScript (ES6+)**, without frameworks, using a combination of:

- **ES Modules** (`import`/`export`) — for core, services, and auth
- **Classic scripts** — for managers, utils, and modules (exposed via `window`)
- **Bridge pattern** — `firebaseGlobals.js` connects both worlds

This approach maintains vanilla JS simplicity while benefiting from native modules for layers that require better encapsulation.

---

### Structure by Responsibility

```
js/
├── auth/                      # Authentication
│   ├── LoginHandler.js        # Login (username/password + Google OAuth)
│   ├── RegisterHandler.js     # Registration (form + Google)
│   └── ForgotPasswordHandler.js  # Password recovery
│
├── core/                      # Bootstrap & Infrastructure
│   ├── app.js                 # Auth page entry point
│   ├── firebaseConfig.js      # Firebase initialization + method re-export
│   ├── firebaseDataService.js # Generic Firestore CRUD
│   ├── firebaseGlobals.js     # Bridge: ES6 modules → window (classic scripts)
│   ├── firebase.env.js        # Firebase & OpenAI credentials (not versioned)
│   ├── emailjsInit.js         # EmailJS initialization
│   └── EventBus.js            # Centralized pub/sub event bus
│
├── managers/                  # State & UI Management
│   ├── dashboard.js           # Dashboard page entry point
│   ├── DashboardManager.js    # Dashboard shell (auth, sidebar, navigation)
│   ├── PageManager.js         # Router — maps page names to handlers
│   ├── TabManager.js          # Multi-tab system (Ctrl+T, Ctrl+W)
│   ├── UIManager.js           # Toasts, button loading, field errors
│   ├── FormManager.js         # Animated auth form transitions
│   ├── FormStateManager.js    # Form state preservation across tabs
│   └── LoadingManager.js      # Full-screen loading overlay
│
├── modules/                   # Feature Modules
│   ├── documents/             # Document management
│   ├── exams/                 # Medical exams
│   ├── expenses/              # Financial (income, expenses, reports)
│   ├── personal/              # Personal (tasks, links, passwords, shopping, wishlist)
│   ├── settings/              # Settings (profile, security, preferences, account)
│   ├── support/               # User support
│   └── training/              # Training (gym workouts, running)
│
├── services/                  # External Communication
│   ├── UserService.js         # Auth + user profiles
│   ├── FinanceService.js      # Income, fixed expenses, credit card
│   ├── PersonalDataService.js # Unified personal data CRUD
│   ├── TrainingService.js     # Training data CRUD
│   └── DigestService.js       # AI summaries (OpenAI GPT-4o + EmailJS)
│
└── utils/                     # Utility Functions
    ├── Logger.js              # Debug-controlled console wrapper
    ├── Result.js              # Result monad (ok/fail)
    ├── DataGuard.js           # Safe property access, HTML sanitization
    ├── DOMUtils.js            # DOM helpers with element caching
    ├── FormUtils.js           # Input masks + sessionStorage wrappers
    ├── HTMLTemplates.js       # Centralized HTML template system
    ├── Validator.js           # Input validation (email, password, phone)
    ├── AuthErrorMapper.js     # Firebase Auth errors → Portuguese messages
    ├── ThemeManager.js        # Theme toggle and persistence
    └── VersionManager.js      # Version badge + changelog modal
```

---

### Layer Details

#### `auth/` — Authentication

Handlers for the three authentication actions. All use **dependency injection** via constructor.

| File | Responsibility |
|---|---|
| `LoginHandler.js` | Username/password login (lookup by username → email-based auth) and Google OAuth. Manages loading states, errors, and redirect. iOS `touchend` support. |
| `RegisterHandler.js` | Two-mode registration: form (email/password) or Google. Two-step UI: method selection → field input. Validation via `Validator`. |
| `ForgotPasswordHandler.js` | Password recovery via Firebase `sendPasswordResetEmail`. Looks up email by username and auto-returns to login after 5 seconds. |

#### `core/` — Bootstrap & Infrastructure

Initialization and fundamental infrastructure layer.

| File | Type | Responsibility |
|---|---|---|
| `app.js` | ES Module | `index.html` entry point. Creates services and initializes auth handlers. |
| `firebaseConfig.js` | ES Module | Initializes Firebase SDK v11.6.1 (app, auth, firestore, storage). Re-exports all Firebase functions for consumption by other modules. |
| `firebaseDataService.js` | ES Module | Static class with generic Firestore CRUD. Path: `/artifacts/{appId}/users/{userId}/{collection}`. `removeUndefinedFields()` for recursive data cleaning. Real-time via `onSnapshot`. |
| `firebaseGlobals.js` | ES Module | **Bridge pattern** — imports everything from `firebaseConfig.js` + `FirebaseDataService` and exposes on `window.firebaseGlobals` for classic scripts. |
| `firebase.env.js` | ES Module | Firebase credentials and OpenAI key. **Should be in `.gitignore`**. |
| `EventBus.js` | Script | Singleton pub/sub with `on`, `once`, `off`, `emit`, `emitAsync`. Typed and frozen events (`Object.freeze`). Exposed via `window.EventBus`. |

#### `managers/` — State & UI Management

Classes responsible for orchestrating the interface and managing states.

| File | Responsibility |
|---|---|
| `DashboardManager.js` | Dashboard shell: auth verification, sidebar population (user data, expandable folder navigation), sidebar toggle, SweetAlert2 logout confirmation. |
| `PageManager.js` | **Central router.** Route map: `{'gastos' → renderExpenses(), 'treinos' → renderTraining(), ...}`. Lazy-creates handlers on first navigation. Instantiates Services once and passes them to handlers. 12 routes, ~578 lines. |
| `TabManager.js` | Browser-like multi-tab system. Creates/switches/closes tabs. Each tab has its own content container. Shortcuts: `Ctrl+T` (new tab), `Ctrl+W` (close tab). Uses `FormStateManager` for state preservation. Tab deduplication. ~597 lines. |
| `UIManager.js` | Fully-static class. Toasts (`showMessage`), button loading state (`toggleButtonLoading`), inline field errors (`showFieldError`, `clearFormErrors`). |
| `FormManager.js` | Animated CSS transitions between authentication forms (login ↔ register ↔ recovery). |
| `FormStateManager.js` | Saves and restores complete form state when switching tabs: input values, section visibility, editing state. ~400 lines with granular SRP methods. |
| `LoadingManager.js` | Full-screen overlay: multi-ring spinner → animated checkmark → progress → fade out. API: `show()`, `showSuccess()`, `hide()`, `showSequence()`. |

#### `modules/` — Feature Modules

Each module follows the consistent **Base + Specialization + Handler** pattern:

```
modules/{module}/
├── Base{Module}Module.js       # Base class with generic CRUD
├── {Sub}Module.js              # Specialized modules (inheritance or composition)
└── {Module}PageHandler.js      # Page orchestrator
```

| Module | Files | Description |
|---|---|---|
| **expenses** | 6 files | `BaseExpenseModule` → `FixedExpensesModule`, `CreditExpensesModule`. `IncomePageHandler`, `ExpensesPageHandler`, `ReportPageHandler` orchestrate pages. Credit card auto-calculates `installmentValue` and `endDate`. Fixed bills auto-reset on the 1st of each month. |
| **personal** | 9 files | `BasePersonalModule` → `NotesModule`, `TasksModule`, `LinksModule`, `PasswordsModule`, `ShoppingModule`, `WishlistModule`, `RemindersModule`. `PersonalPageHandler` manages internal tabs. |
| **training** | 4 files | `BaseTrainingModule` → `WorkoutModule` (exercises and sets), `RunningModule` (runs). `TrainingPageHandler` orchestrates. Uses `TrainingService` (classic script via `window.firebaseGlobals`). |
| **settings** | 6 files | `BaseSettingsModule` → `ProfileModule`, `SecurityModule` (password change, Google linking), `PreferencesModule` (digest/notifications), `AccountInfoModule`. `SettingsPageHandler` orchestrates. |
| **documents** | 1 file | `DocumentsPageHandler` — upload, listing, drag & drop reordering with Firestore persistence. |
| **exams** | 1 file | `ExamsPageHandler` — medical exam registration and listing. |
| **support** | 1 file | `SupportPageHandler` — support page. |

#### `services/` — External Communication

Service layer that abstracts Firebase and external API communication.

| File | Type | Responsibility |
|---|---|---|
| `UserService.js` | ES Module | Firebase Auth: account creation, login (email/password + Google), password recovery. Sequential username generation (`SIGP000`, `SIGP001`...). Firestore profile management. Google account conflict detection and merging. ~914 lines. |
| `FinanceService.js` | ES Module | CRUD for income (single doc `userIncome`), fixed expenses, and credit card. In-memory cache with `loaded` flags. Auto-calculation of installments and per-installment value. Monthly payment status reset. ~764 lines. |
| `PersonalDataService.js` | ES Module | Unified interface for 7 sub-modules (notes, tasks, links, passwords, shopping, wishlist, reminders): `getAll(module)`, `add(module, data)`, `update(module, id, data)`, `delete(module, id)`. Dispatches to module-specific private methods. In-memory cache. ~760 lines. |
| `TrainingService.js` | Classic script | CRUD for gym workouts and running. Uses `window.firebaseGlobals` for Firebase access. Lazy initialization with retry. Collection: `training-{moduleName}`. ~504 lines. |
| `DigestService.js` | ES Module | Thin client over the Cloud Functions: invokes the `sendDigestOnLogin` callable right after login (when the user has the digest enabled) and `sendDigestNow` from the "Send now" button. Also loads/saves preferences at `artifacts/{appId}/users/{uid}/notifications/preferences`. All OpenAI and EmailJS calls happen on the backend. ~135 lines. |

#### `utils/` — Utility Functions

Static classes and reusable helpers across the application.

| File | Global Scope | Responsibility |
|---|---|---|
| `Logger.js` | `window.Logger` | Console wrapper controlled by `DEBUG` flag. Methods: `log`, `warn`, `error`, `info` — all no-ops when `DEBUG=false`. |
| `Result.js` | `window.Result` | **Result monad** for exception-free flows. `Result.ok(data)` / `Result.fail(error)`. Methods: `unwrap()`, `unwrapOr(default)`, `map(fn)`. |
| `DataGuard.js` | `window.DataGuard` | Defensive property access: `get(obj, 'path.to.prop', default)`. Typed specializations: `getString`, `getNumber`, `getArray`. `escapeHtml()` for XSS prevention. `validateDoc(doc, schema)` for schema-based cleaning. |
| `DOMUtils.js` | `window.DOMUtils` | DOM helpers with `Map` cache. `getById`, `getInputValue`, `show/hide/toggle`, `addClass/removeClass`, `addListener` (with auto-cleanup). `debounce`, `throttle`, `nextFrame`. |
| `FormUtils.js` | `window.FormUtils` | Brazilian phone mask (`applyPhoneMask`). `sessionStorage` wrappers: `getCurrentUser()`, `setCurrentUser()`, `clearCurrentUser()`. |
| `HTMLTemplates.js` | `window.HTMLTemplates` | Object literal with namespaced templates: `icons` (SVGs), `buttons` (edit/delete/markPaid), `cards` (expense, fixed, credit), `forms` (wrapper, inputGroup, selectGroup), `states` (empty, loading, error), `lists` (wrapper, render). ~518 lines. |
| `Validator.js` | `window.Validator` | Validations: `validateRequired`, `validateEmail`, `validatePasswordLength`, `validatePasswordMatch`, `validatePasswordStrength`, `validateUsername`, `validatePhone`. |
| `AuthErrorMapper.js` | `window.AuthErrorMapper` | Three lookup tables: `AUTH_ERROR_MESSAGES` (general), `CONTEXT_OVERRIDES` (login/register/reset), `DEFAULT_MESSAGES` (fallback). `getMessage(error, context)` resolves by priority. |
| `ThemeManager.js` | `window.ThemeManager` | Auto-instantiated singleton. `loadSavedTheme()` runs before DOM (prevents FOUC). `toggleTheme()` switches classes, updates `meta[theme-color]`, dispatches `CustomEvent('themeChanged')`. Persists in `localStorage`. |
| `VersionManager.js` | — | Loads `version.json`, renders version badge in sidebar. `showChangelog()` opens SweetAlert2 modal with version history. ~254 lines. |

---

### Architectural Pattern

The application adopts a **layered architecture with centralized orchestration**:

```
┌─────────────────────────────────────────────────────┐
│                    HTML Pages                       │
│            (static entry points)                    │
├───────────┬─────────────────────────┬───────────────┤
│  app.js   │     dashboard.js        │  (bootstrap)  │
├───────────┴─────────────────────────┴───────────────┤
│                Manager Layer                        │
│  PageManager (router) → creates handlers on-demand  │
│  TabManager → manages parallel contexts             │
│  DashboardManager → shell and auth                  │
├─────────────────────────────────────────────────────┤
│                Module Layer                         │
│  PageHandler → orchestrates HTML + sub-modules      │
│  BaseModule → generic CRUD                          │
│  SubModule → specialized logic                      │
├─────────────────────────────────────────────────────┤
│                Service Layer                        │
│  Abstracts Firebase/APIs. Cache. Business rules.    │
├─────────────────────────────────────────────────────┤
│                Core Layer                           │
│  Firebase SDK, generic Firestore, EventBus          │
├─────────────────────────────────────────────────────┤
│                Utils Layer                          │
│  Pure functions, helpers, validation, sanitization  │
└─────────────────────────────────────────────────────┘
```

**Principles:**
1. **Unidirectional flow** — data flows down from Services to Modules, events bubble up via callbacks or EventBus
2. **Lazy initialization** — handlers and services are created only when needed
3. **Data isolation** — each user has their own Firestore namespace
4. **Cache first** — Services maintain in-memory cache, avoiding unnecessary reads
5. **Fail-safe** — `Result` monad and `DataGuard` prevent silent failures

---

### Application Flow

#### Authentication Page (`index.html`)

```
1. index.html loads scripts
2. app.js (ES Module entry point):
   ├── Creates UserService (Firebase Auth + Firestore)
   ├── Creates UIManager, LoadingManager, FormManager
   ├── Creates LoginHandler (with DI)
   ├── Creates RegisterHandler (with DI)
   └── Creates ForgotPasswordHandler (with DI)
3. User fills in form
4. Handler validates → calls UserService → Firebase Auth
5. Success → sessionStorage.setUser() → redirect to dashboard.html
```

#### Dashboard (`dashboard.html`)

```
1. dashboard.html loads scripts (ES modules + classic)
2. ThemeManager.loadSavedTheme() — before DOM (prevents flash)
3. dashboard.js (ES Module entry point):
   ├── onAuthStateChanged → verifies authentication
   ├── Creates DashboardManager (sidebar, nav, logout)
   ├── Creates PageManager (router, instantiates Services)
   ├── Creates TabManager (tabs, delegates to PageManager)
   └── DigestService.checkAndSend() (AI summary)
4. User clicks a menu item
5. DashboardManager → TabManager.openTab(pageName)
6. TabManager → PageManager.loadPage(pageName, container)
7. PageManager:
   ├── Lazy-creates corresponding handler
   ├── Handler receives Service(s) via constructor
   └── Handler renders HTML + initializes interactions
8. Interactions → Handler → Service → FirebaseDataService → Firestore
```

---

### Script Types

The project uses two loading types, connected by a bridge:

| Type | Example | Scope | Access |
|---|---|---|---|
| **ES Module** | `<script type="module" src="...">` | Closed scope (`import`/`export`) | Via direct `import` |
| **Classic script** | `<script src="...">` | Global scope (`window.*`) | Via `window.ClassName` |
| **Bridge** | `firebaseGlobals.js` | Exposes ES modules to `window` | Via `window.firebaseGlobals` |

**General rule:**
- **Core, Services, Auth** → ES Modules (better encapsulation)
- **Managers, Utils, Modules** → Classic scripts (direct access between them)
- **Cross-world communication** → `firebaseGlobals.js` (bridge)

---

### Adding a New Module

#### 1. Create the module files

```
modules/my-module/
├── BaseMyModuleModule.js      # (Optional) Base class if sub-modules exist
├── MyModulePageHandler.js     # Required orchestrator
└── SubModule.js               # (Optional) Specialized sub-modules
```

#### 2. Create the PageHandler

```javascript
class MyModulePageHandler {
    constructor(service) {
        this.service = service;  // Received via DI
        this.container = null;
    }

    renderPage(container) {
        this.container = container;
        container.innerHTML = `
            <div class="hero-section">
                <h2>My Module</h2>
            </div>
            <div class="my-module-container">
                <!-- Content -->
            </div>
        `;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        const result = await this.service.getAll();
        if (result.ok) {
            this.renderItems(result.data);
        }
    }

    setupEventListeners() {
        // Event bindings
    }

    renderItems(items) {
        // Render item list
    }
}
```

#### 3. Register in PageManager

In `PageManager.js`, add the route:

```javascript
// In the constructor, add to the pages map:
this.pages = {
    // ... existing routes
    'my-module': (container) => this.renderMyModule(container),
};

// Create the render method:
async renderMyModule(container) {
    if (!this.myModuleHandler) {
        this.myModuleHandler = new MyModulePageHandler(this.myService);
    }
    this.myModuleHandler.renderPage(container);
}
```

#### 4. Add navigation in `dashboard.html`

```html
<!-- In the sidebar -->
<a href="#" class="nav-item" data-page="my-module">
    <span class="nav-icon">📦</span>
    <span class="nav-text">My Module</span>
</a>
```

#### 5. Include scripts in `dashboard.html`

```html
<!-- My Module -->
<script src="assets/js/modules/my-module/MyModulePageHandler.js"></script>
```

#### 6. Create matching CSS

Follow the guide in [`assets/css/README.md`](../css/README.md).

---

### Integrating a New Feature

#### New Service (Firebase communication)

```javascript
// services/MyService.js (ES Module)
import { FirebaseDataService } from '../core/firebaseDataService.js';

export class MyService {
    constructor() {
        this.cache = [];
        this.loaded = false;
    }

    async getAll(userId) {
        if (this.loaded) return Result.ok(this.cache);
        
        const result = await FirebaseDataService.getCollectionDocuments(
            userId, 'my-collection'
        );
        
        if (result) {
            this.cache = result;
            this.loaded = true;
            return Result.ok(this.cache);
        }
        return Result.fail('Failed to load data');
    }

    async add(userId, data) {
        const cleaned = DataGuard.validateDoc(data, this.schema);
        return await FirebaseDataService.saveDocument(
            userId, 'my-collection', cleaned
        );
    }

    invalidateCache() {
        this.cache = [];
        this.loaded = false;
    }
}
```

#### New Util (reusable helper)

```javascript
// utils/MyUtil.js
class MyUtil {
    static myFunction(param) {
        // Implementation
    }
}

// Expose globally
window.MyUtil = MyUtil;
```

---

### Scalability

The SIGP architecture is designed to scale predictably:

| Aspect | How it scales |
|---|---|
| **New modules** | Create folder in `modules/`, register route in `PageManager`, add nav in HTML |
| **New services** | Create in `services/`, import in `PageManager`, inject into handlers |
| **New utils** | Create in `utils/`, expose on `window`, include in HTML |
| **New tabs in module** | Add to existing `PageHandler` (uses internal `TabManager`) |
| **New sub-modules** | Inherit from `Base*Module`, register in corresponding `PageHandler` |
| **New themes** | Create CSS, register in `ThemeManager` |
| **New validations** | Add methods to `Validator.js` |
| **New templates** | Add namespaces to `HTMLTemplates.js` |
| **New events** | Register in the `Events` object within `EventBus.js` |

**Extension points:**
- `PageManager.pages` — central route map
- `HTMLTemplates.*` — reusable templates
- `Events` — typed event constants
- `DataGuard.validateDoc()` — validation schemas
- `AuthErrorMapper.AUTH_ERROR_MESSAGES` — error mappings

---

### Patterns and Conventions

#### Naming

| Type | Pattern | Example |
|---|---|---|
| Class | PascalCase | `ExpensesPageHandler`, `FinanceService` |
| File | PascalCase (matches class) | `ExpensesPageHandler.js` |
| Method | camelCase | `renderPage()`, `loadData()` |
| Constant | UPPER_SNAKE_CASE | `AUTH_ERROR_MESSAGES`, `DEBUG` |
| Private variable | camelCase (no prefix) | `this.cache`, `this.loaded` |
| Event | PascalCase with `:` | `Module:loaded`, `Data:updated` |

#### Design Patterns

| Pattern | Implementation |
|---|---|
| **Dependency injection** | Handlers receive Services via constructor |
| **Result monad** | `Result.ok(data)` / `Result.fail(error)` — no try/catch in normal flows |
| **Singleton** | `EventBus`, `ThemeManager` — single instance on `window` |
| **Static utility** | `UIManager`, `Logger`, `DataGuard`, `DOMUtils`, `Validator` — all static methods |
| **Bridge** | `firebaseGlobals.js` connects ES modules to classic scripts |
| **Cache-first** | Services load from Firestore once, then serve from memory |
| **Lazy creation** | `PageManager` instantiates handlers only on first access |
| **Template method** | `Base*Module` defines CRUD interface, sub-classes specialize |
| **Defensive access** | `DataGuard.get(obj, 'deep.path', fallback)` instead of `obj.deep.path` |

#### Best Practices

- Use `Result` for operations that may fail
- Use `DataGuard` for external data access (Firebase responses)
- Use `HTMLTemplates` for programmatic HTML generation
- Use `Logger` instead of direct `console.log`
- Validate inputs with `Validator` before sending to Service
- Sanitize output with `DataGuard.escapeHtml()` to prevent XSS
- Keep Services with cache and `loaded` flags for performance
- Document public methods with JSDoc
