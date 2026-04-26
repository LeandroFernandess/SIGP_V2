/**
 * @file ReportPageHandler.js
 * @description Financial reports with charts and analysis.
 * 
 * Contents:
 * - Summary cards (income, expenses, balance, percentage)
 * - Donut chart by category
 * - Financial health indicator (green/yellow/red)
 * - Category breakdown with progress bars
 * - Wishlist integration
 * 
 * Dependencies:
 * - FinanceService (data aggregation)
 * - PersonalDataService (wishlist)
 * - Chart.js (visualization)
 * 
 * @author Leandro Fialho Fernandes
 */

/**
 * @class ReportPageHandler
 * @description Manages the financial reports page with visualizations
 */
class ReportPageHandler {

    /**
     * Initializes the reports handler
     * 
     * @constructor
     * @param {FinanceService} financeService - Financial service instance
     * @param {number} userId - Logged user ID
     * @param {PersonalDataService|null} personalDataService - Service for wishlist integration (optional)
     * 
     * @example
     * const handler = new ReportPageHandler(financeService, 123, personalDataService);
     */
    constructor(financeService, userId, personalDataService = null) {
        this.financeService = financeService;
        this.userId = userId;
        this.personalDataService = personalDataService;
    }

    /**
     * Renders the complete reports page
     * @returns {Promise<string>} Reports page HTML
     */
    async render() {
        const report = await this.financeService.getFinancialReport(this.userId);

        if (report.income === 0) {
            return this.renderEmptyState();
        }

        let wishlistData = { total: 0, count: 0 };
        if (this.personalDataService) {
            try {
                const wishlist = await this.personalDataService.getWishlistItems(this.userId);
                const pendingWishes = wishlist.filter(w => !w.achieved);
                wishlistData = {
                    total: pendingWishes.reduce((sum, wish) => sum + (wish.price || 0), 0),
                    count: pendingWishes.length
                };
            } catch (error) {
                console.warn('Não foi possível carregar a wishlist:', error);
            }
        }

        return `
            <div class="report-container">
                <div class="report-hero page-hero">
                    <h1>📊 Relatório Financeiro</h1>
                    <p>Visão completa da sua saúde financeira e distribuição de gastos</p>
                </div>

                ${this.renderFinancialSummarySection(report, wishlistData)}
                ${this.renderVisualizationsSection(report)}
                ${this.renderActionsSection()}
            </div>
        `;
    }

    /**
     * Renders financial summary section with organized cards
     * @param {Object} report - Financial report data
     * @param {Object} wishlistData - Wishlist data
     * @returns {string} Financial summary HTML
     */
    renderFinancialSummarySection(report, wishlistData) {
        const healthPercentage = Math.max(0, Math.min(100, ((report.balance / report.income) * 100)));
        let healthStatus, healthColor, healthIcon;

        if (healthPercentage >= 50) {
            healthStatus = 'Excelente';
            healthColor = '#10b981';
            healthIcon = '🎉';
        } else if (healthPercentage >= 30) {
            healthStatus = 'Bom';
            healthColor = '#3b82f6';
            healthIcon = '👍';
        } else if (healthPercentage >= 15) {
            healthStatus = 'Atenção';
            healthColor = '#f59e0b';
            healthIcon = '⚠️';
        } else {
            healthStatus = 'Crítico';
            healthColor = '#ef4444';
            healthIcon = '🚨';
        }

        return `
            <div class="report-intro">
                <p class="intro-text">Análise completa do seu desempenho financeiro mensal</p>
            </div>

            <div class="report-sections-grid">
                <!-- RESUMO FINANCEIRO -->
                <div class="report-section">
                    <div class="section-header">
                        <div class="section-icon">💰</div>
                        <div class="section-info">
                            <h3>Resumo Financeiro</h3>
                            <p>Principais indicadores do mês</p>
                        </div>
                    </div>
                    <div class="section-metrics">
                        <div class="metric-card">
                            <div class="metric-icon u-color-green">💵</div>
                            <div class="metric-content">
                                <span class="metric-label">Renda Mensal</span>
                                <span class="metric-value u-text-green">R$ ${this.formatMoney(report.income)}</span>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon u-color-red">📊</div>
                            <div class="metric-content">
                                <span class="metric-label">Gastos Totais</span>
                                <span class="metric-value u-text-red">R$ ${this.formatMoney(report.totalExpenses)}</span>
                            </div>
                        </div>
                        <div class="metric-card highlight-card">
                            <div class="metric-icon u-color-balance">💰</div>
                            <div class="metric-content">
                                <span class="metric-label">Saldo Disponível</span>
                                <span class="metric-value u-large-bold" style="color: ${report.balance >= 0 ? '#10b981' : '#ef4444'}">
                                    R$ ${this.formatMoney(report.balance)}
                                </span>
                                <span class="metric-sublabel">Após todas as despesas</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SAÚDE FINANCEIRA -->
                <div class="report-section">
                    <div class="section-header">
                        <div class="section-icon">${healthIcon}</div>
                        <div class="section-info">
                            <h3>Saúde Financeira</h3>
                            <p>Análise do seu desempenho</p>
                        </div>
                    </div>
                    <div class="section-health">
                        <div class="health-score-display">
                            <div class="health-score-circle" style="border-color: ${healthColor};">
                                <span class="health-score-value" style="color: ${healthColor};">${Math.round(healthPercentage)}%</span>
                                <span class="health-score-label">Saldo</span>
                            </div>
                            <div class="health-status-info">
                                <span class="health-status-badge" style="background: ${healthColor}20; color: ${healthColor};">
                                    ${healthStatus}
                                </span>
                                <p class="health-description">
                                    ${healthPercentage >= 50 ? 'Suas finanças estão muito saudáveis!' : 
                                      healthPercentage >= 30 ? 'Suas finanças estão em bom estado.' : 
                                      healthPercentage >= 15 ? 'Cuidado com os gastos, saldo está baixo.' : 
                                      'Atenção! Gastos estão muito altos!'}
                                </p>
                            </div>
                        </div>
                        <div class="health-breakdown">
                            <div class="health-breakdown-item">
                                <span class="breakdown-label">Taxa de Gastos</span>
                                <div class="breakdown-bar">
                                    <div class="breakdown-fill" style="width: ${report.expensePercentage}%; background: #ef4444;"></div>
                                </div>
                                <span class="breakdown-value">${report.expensePercentage}%</span>
                            </div>
                            <div class="health-breakdown-item">
                                <span class="breakdown-label">Taxa de Economia</span>
                                <div class="breakdown-bar">
                                    <div class="breakdown-fill" style="width: ${Math.max(0, 100 - report.expensePercentage)}%; background: #10b981;"></div>
                                </div>
                                <span class="breakdown-value">${Math.max(0, 100 - report.expensePercentage).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DISTRIBUIÇÃO DE GASTOS -->
                <div class="report-section">
                    <div class="section-header">
                        <div class="section-icon">💳</div>
                        <div class="section-info">
                            <h3>Distribuição de Gastos</h3>
                            <p>Como seu dinheiro está sendo usado</p>
                        </div>
                    </div>
                    <div class="section-distribution">
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-purple">🏠</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Gastos Fixos</span>
                                    <span class="distribution-percentage">${((report.totalFixed / report.totalExpenses) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                            <div class="distribution-value">R$ ${this.formatMoney(report.totalFixed)}</div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-blue">💳</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Cartão de Crédito</span>
                                    <span class="distribution-percentage">${((report.totalCredit / report.totalExpenses) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                            <div class="distribution-value">R$ ${this.formatMoney(report.totalCredit)}</div>
                        </div>
                        ${wishlistData.count > 0 ? `
                        <div class="distribution-item wishlist-item">
                            <div class="distribution-header">
                                <span class="distribution-icon u-color-amber">⭐</span>
                                <div class="distribution-info">
                                    <span class="distribution-label">Lista de Desejos</span>
                                    <span class="distribution-percentage wishlist-badge">${wishlistData.count} ${wishlistData.count === 1 ? 'item' : 'itens'}</span>
                                </div>
                            </div>
                            <div class="distribution-value u-text-amber">R$ ${this.formatMoney(wishlistData.total)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders visualizations section with charts
     * @param {Object} report - Financial report data
     * @returns {string} Visualizations HTML
     */
    renderVisualizationsSection(report) {
        return `
            <div class="report-visualizations">
                <div class="visualization-header">
                    <h2>📈 Visualizações</h2>
                    <p>Gráficos e análises detalhadas dos seus gastos</p>
                </div>
                
                <div class="charts-grid">
                    ${this.renderBarChart(report)}
                    ${this.renderDonutChart(report)}
                </div>
            </div>
        `;
    }

    /**
     * Renders quick actions section
     * @returns {string} Actions section HTML
     */
    renderActionsSection() {
        return `
            <div class="report-actions">
                <div class="actions-header">
                    <h2>⚡ Ações Rápidas</h2>
                    <p>Gerencie suas finanças de forma eficiente</p>
                </div>
                <div class="actions-grid">
                    <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('renda-mensal'); return false;">
                        <span class="btn-icon">💵</span>
                        <span class="btn-label">Ajustar Renda</span>
                    </button>
                    <button class="action-btn" onclick="window.tabManager.openPageFromQuickAccess('gastos'); return false;">
                        <span class="btn-icon">💳</span>
                        <span class="btn-label">Gerenciar Gastos</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renders financial overview cards
     * @param {Object} report - Financial report data
     * @param {Object} wishlistData - Wishlist data
     * @returns {string} Overview cards HTML
     */
    renderOverviewCards(report, wishlistData) {
        return `
            <div class="financial-overview-grid">
                <div class="overview-card main-card">
                    <div class="overview-card-icon">💰</div>
                    <div class="overview-card-content">
                        <h3>Saldo Disponível</h3>
                        <p class="overview-value ${report.balance >= 0 ? 'positive' : 'negative'}">
                            R$ ${this.formatMoney(report.balance)}
                        </p>
                        <span class="overview-label">Após despesas</span>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-card-icon u-color-green">💵</div>
                    <div class="overview-card-content">
                        <h3>Renda Mensal</h3>
                        <p class="overview-value">R$ ${this.formatMoney(report.income)}</p>
                        <span class="overview-label">Total recebido</span>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-card-icon u-color-red">📊</div>
                    <div class="overview-card-content">
                        <h3>Gastos Totais</h3>
                        <p class="overview-value">R$ ${this.formatMoney(report.totalExpenses)}</p>
                        <span class="overview-label">${report.expensePercentage}% da renda</span>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-card-icon u-color-blue">💳</div>
                    <div class="overview-card-content">
                        <h3>Cartão de Crédito</h3>
                        <p class="overview-value">R$ ${this.formatMoney(report.totalCredit)}</p>
                        <span class="overview-label">Parcelas ativas</span>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-card-icon u-color-purple">💵</div>
                    <div class="overview-card-content">
                        <h3>Gastos Fixos</h3>
                        <p class="overview-value">R$ ${this.formatMoney(report.totalFixed)}</p>
                        <span class="overview-label">Mensais</span>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-card-icon u-color-amber">⭐</div>
                    <div class="overview-card-content">
                        <h3>Lista de Desejos</h3>
                        <p class="overview-value u-text-amber">R$ ${this.formatMoney(wishlistData.total)}</p>
                        <span class="overview-label">${wishlistData.count} ${wishlistData.count === 1 ? 'desejo' : 'desejos'} pendentes</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders financial health indicator
     * @param {Object} report - Financial report data
     * @returns {string} Health indicator HTML
     */
    renderHealthIndicator(report) {
        const healthPercentage = Math.max(0, Math.min(100, ((report.balance / report.income) * 100)));
        let healthStatus, healthColor, healthIcon, healthMessage;

        if (healthPercentage >= 50) {
            healthStatus = 'Excelente';
            healthColor = '#10b981';
            healthIcon = '🎉';
            healthMessage = 'Suas finanças estão muito saudáveis!';
        } else if (healthPercentage >= 30) {
            healthStatus = 'Bom';
            healthColor = '#3b82f6';
            healthIcon = '👍';
            healthMessage = 'Suas finanças estão em bom estado.';
        } else if (healthPercentage >= 15) {
            healthStatus = 'Atenção';
            healthColor = '#f59e0b';
            healthIcon = '⚠️';
            healthMessage = 'Cuidado com os gastos, saldo está baixo.';
        } else {
            healthStatus = 'Crítico';
            healthColor = '#ef4444';
            healthIcon = '🚨';
            healthMessage = 'Atenção! Gastos estão muito altos!';
        }

        return `
            <div class="financial-health-card" style="border-color: ${healthColor};">
                <div class="health-header">
                    <div class="health-icon">${healthIcon}</div>
                    <div class="health-info">
                        <h3>Saúde Financeira</h3>
                        <p class="health-status" style="color: ${healthColor};">${healthStatus}</p>
                    </div>
                    <div class="health-score" style="color: ${healthColor};">
                        ${Math.round(healthPercentage)}%
                    </div>
                </div>
                <div class="health-bar-container">
                    <div class="health-bar" style="width: ${healthPercentage}%; background: ${healthColor};"></div>
                </div>
                <p class="health-message">${healthMessage}</p>
            </div>
        `;
    }

    /**
     * Renders row with side-by-side charts
     * @param {Object} report - Financial report data
     * @returns {string} Charts HTML
     */
    renderChartsRow(report) {
        return `
            <div class="charts-row">
                ${this.renderBarChart(report)}
                ${this.renderDonutChart(report)}
            </div>
        `;
    }

    /**
     * Renders comparative bar chart
     * @param {Object} report - Financial report data
     * @returns {string} Bar chart HTML
     */
    renderBarChart(report) {
        const maxValue = Math.max(report.income, report.totalExpenses, Math.abs(report.balance)) || 1;
        const incomeHeight = (report.income / maxValue) * 100;
        const expensesHeight = (report.totalExpenses / maxValue) * 100;
        const balanceHeight = (Math.abs(report.balance) / maxValue) * 100;
        const savingRate = Math.max(0, 100 - report.expensePercentage).toFixed(1);

        let insightIcon, insightTitle, insightMessage, insightType;
        if (report.expensePercentage <= 50) {
            insightIcon = '🎯';
            insightTitle = 'Excelente Controle!';
            insightMessage = 'Você está guardando mais da metade da sua renda';
            insightType = 'success';
        } else if (report.expensePercentage <= 70) {
            insightIcon = '✅';
            insightTitle = 'Bom Equilíbrio';
            insightMessage = 'Gastos dentro de uma margem saudável';
            insightType = 'good';
        } else if (report.expensePercentage <= 90) {
            insightIcon = '⚠️';
            insightTitle = 'Atenção Necessária';
            insightMessage = 'Considere reduzir gastos não essenciais';
            insightType = 'warning';
        } else {
            insightIcon = '🚨';
            insightTitle = 'Alerta Crítico';
            insightMessage = 'Gastos ultrapassaram limite seguro';
            insightType = 'danger';
        }

        return `
            <div class="chart-container chart-card bar-chart-card">
                <div class="chart-header-enhanced">
                    <div class="chart-title-area">
                        <div class="chart-icon-wrapper">
                            <span class="chart-main-icon">📊</span>
                        </div>
                        <div class="chart-title-content">
                            <h3>Visão Geral do Mês</h3>
                            <p class="chart-subtitle">Comparativo renda vs gastos</p>
                        </div>
                    </div>
                </div>

                <div class="key-metrics-strip">
                    <div class="key-metric income-metric">
                        <div class="metric-indicator"></div>
                        <div class="metric-data">
                            <span class="metric-title">Entrada</span>
                            <span class="metric-amount">R$ ${this.formatMoney(report.income)}</span>
                        </div>
                    </div>
                    <div class="key-metric expense-metric">
                        <div class="metric-indicator"></div>
                        <div class="metric-data">
                            <span class="metric-title">Saída</span>
                            <span class="metric-amount">R$ ${this.formatMoney(report.totalExpenses)}</span>
                        </div>
                    </div>
                    <div class="key-metric balance-metric ${report.balance >= 0 ? 'positive' : 'negative'}">
                        <div class="metric-indicator"></div>
                        <div class="metric-data">
                            <span class="metric-title">Sobra</span>
                            <span class="metric-amount">R$ ${this.formatMoney(report.balance)}</span>
                        </div>
                    </div>
                </div>

                <div class="visual-bar-section">
                    <div class="bar-chart-modern">
                        <div class="bar-item-modern">
                            <div class="bar-header">
                                <span class="bar-emoji">💵</span>
                                <span class="bar-title">Renda</span>
                            </div>
                            <div class="bar-track">
                                <div class="bar-progress income-progress" style="width: ${incomeHeight}%;">
                                    <span class="bar-progress-value">100%</span>
                                </div>
                            </div>
                            <span class="bar-amount">R$ ${this.formatMoney(report.income)}</span>
                        </div>

                        <div class="bar-item-modern">
                            <div class="bar-header">
                                <span class="bar-emoji">💳</span>
                                <span class="bar-title">Gastos</span>
                            </div>
                            <div class="bar-track">
                                <div class="bar-progress expense-progress" style="width: ${expensesHeight}%;">
                                    <span class="bar-progress-value">${report.expensePercentage}%</span>
                                </div>
                            </div>
                            <span class="bar-amount">R$ ${this.formatMoney(report.totalExpenses)}</span>
                        </div>

                        <div class="bar-item-modern">
                            <div class="bar-header">
                                <span class="bar-emoji">${report.balance >= 0 ? '💰' : '📉'}</span>
                                <span class="bar-title">Saldo</span>
                            </div>
                            <div class="bar-track">
                                <div class="bar-progress balance-progress ${report.balance >= 0 ? 'positive' : 'negative'}" style="width: ${balanceHeight}%;">
                                    <span class="bar-progress-value">${savingRate}%</span>
                                </div>
                            </div>
                            <span class="bar-amount ${report.balance >= 0 ? 'text-positive' : 'text-negative'}">R$ ${this.formatMoney(report.balance)}</span>
                        </div>
                    </div>
                </div>

                <div class="insight-card ${insightType}">
                    <div class="insight-icon">${insightIcon}</div>
                    <div class="insight-content">
                        <span class="insight-title">${insightTitle}</span>
                        <span class="insight-message">${insightMessage}</span>
                    </div>
                    <div class="insight-stats">
                        <div class="insight-stat">
                            <span class="stat-number">${report.expensePercentage}%</span>
                            <span class="stat-desc">gasto</span>
                        </div>
                        <div class="insight-divider"></div>
                        <div class="insight-stat">
                            <span class="stat-number">${savingRate}%</span>
                            <span class="stat-desc">guardado</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders donut chart with expense distribution by category
     * @param {Object} report - Financial report data
     * @returns {string} Chart container HTML
     */
    renderDonutChart(report) {
        const categories = Object.entries(report.expensesByCategory);
        
        if (categories.length === 0) {
            return `
                <div class="chart-container chart-card donut-chart-card">
                    <div class="chart-header-enhanced">
                        <div class="chart-title-area">
                            <div class="chart-icon-wrapper donut">
                                <span class="chart-main-icon">🎯</span>
                            </div>
                            <div class="chart-title-content">
                                <h3>Distribuição de Gastos</h3>
                                <p class="chart-subtitle">Por categoria</p>
                            </div>
                        </div>
                    </div>
                    <div class="empty-state-mini">
                        <span class="empty-icon">📭</span>
                        <p>Nenhum gasto cadastrado ainda</p>
                    </div>
                </div>
            `;
        }

        const total = report.totalExpenses;
        const sortedCategories = [...categories].sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0];
        const topCategoryPercentage = ((topCategory[1] / total) * 100).toFixed(1);
        
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
        ];

        const categoryIcons = {
            'Moradia': '🏠',
            'Alimentação': '🍔',
            'Transporte': '🚗',
            'Saúde': '💊',
            'Educação': '📚',
            'Lazer': '🎮',
            'Vestuário': '👔',
            'Outros': '📦'
        };

        let currentAngle = 0;
        const paths = sortedCategories.map(([category, value], index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;

            const startX = 150 + 100 * Math.cos((currentAngle - 90) * Math.PI / 180);
            const startY = 150 + 100 * Math.sin((currentAngle - 90) * Math.PI / 180);
            
            currentAngle += angle;
            
            const endX = 150 + 100 * Math.cos((currentAngle - 90) * Math.PI / 180);
            const endY = 150 + 100 * Math.sin((currentAngle - 90) * Math.PI / 180);

            return {
                path: `M 150 150 L ${startX} ${startY} A 100 100 0 ${largeArc} 1 ${endX} ${endY} Z`,
                color: colors[index % colors.length],
                category,
                value,
                percentage: percentage.toFixed(1),
                icon: categoryIcons[category] || '💰'
            };
        });

        const topThree = paths.slice(0, 3);

        return `
            <div class="chart-container chart-card donut-chart-card">
                <div class="chart-header-enhanced">
                    <div class="chart-title-area">
                        <div class="chart-icon-wrapper donut">
                            <span class="chart-main-icon">🎯</span>
                        </div>
                        <div class="chart-title-content">
                            <h3>Distribuição de Gastos</h3>
                            <p class="chart-subtitle">Onde seu dinheiro está indo</p>
                        </div>
                    </div>
                    <div class="categories-count">
                        <span class="count-number">${categories.length}</span>
                        <span class="count-label">categorias</span>
                    </div>
                </div>

                <div class="donut-layout">
                    <div class="donut-visual-section">
                        <div class="donut-chart-svg-container">
                            <svg class="donut-svg" viewBox="0 0 300 300">
                                ${paths.map((item, index) => `
                                    <path 
                                        d="${item.path}" 
                                        fill="${item.color}" 
                                        opacity="0.9"
                                        class="donut-slice"
                                        data-category="${item.category}"
                                        data-value="${item.value}"
                                        data-percentage="${item.percentage}"
                                        data-index="${index}"
                                    />
                                `).join('')}
                                <circle cx="150" cy="150" r="70" fill="var(--card-bg)" />
                                
                                <!-- Maior Gasto Centralizado -->
                                <text x="150" y="125" text-anchor="middle" fill="var(--text-gray)" font-size="10" font-weight="600" text-transform="uppercase" letter-spacing="1">
                                    MAIOR GASTO
                                </text>
                                <text x="150" y="152" text-anchor="middle" fill="var(--text-light)" font-size="15" font-weight="700">
                                    ${categoryIcons[topCategory[0]] || '💰'} ${topCategory[0]}
                                </text>
                                <text x="150" y="178" text-anchor="middle" fill="${colors[0]}" font-size="24" font-weight="800">
                                    ${topCategoryPercentage}%
                                </text>
                            </svg>
                            <div id="donutTooltip" class="donut-tooltip"></div>
                        </div>
                    </div>

                    <div class="donut-details-section">
                        <div class="top-expense-card">
                            <div class="top-expense-header">
                                <span class="top-expense-icon">${categoryIcons[topCategory[0]] || '💰'}</span>
                                <div class="top-expense-info">
                                    <span class="top-expense-label">Categoria com maior gasto</span>
                                    <span class="top-expense-name">${topCategory[0]}</span>
                                </div>
                            </div>
                            <div class="top-expense-stats">
                                <div class="top-expense-percentage">${topCategoryPercentage}%</div>
                                <div class="top-expense-value">R$ ${this.formatMoney(topCategory[1])}</div>
                            </div>
                        </div>
                        
                        <div class="quick-insights">
                            <span class="insights-title">🔍 Top Categorias</span>
                            <div class="top-categories-list">
                                ${topThree.map((item, index) => `
                                    <div class="top-category-item" style="--item-color: ${item.color}">
                                        <div class="rank-badge">${index + 1}º</div>
                                        <div class="category-info">
                                            <span class="category-icon">${item.icon}</span>
                                            <span class="category-name">${item.category}</span>
                                        </div>
                                        <div class="category-stats">
                                            <span class="category-percent">${item.percentage}%</span>
                                            <span class="category-value">R$ ${this.formatMoney(item.value)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="all-categories-grid">
                            <span class="grid-title">Todas as Categorias</span>
                            <div class="categories-chips">
                                ${paths.map(item => `
                                    <div class="category-chip" style="--chip-color: ${item.color}">
                                        <span class="chip-color"></span>
                                        <span class="chip-name">${item.category}</span>
                                        <span class="chip-percent">${item.percentage}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders detailed category breakdown
     * @param {Object} report - Financial report data
     * @returns {string} Category breakdown HTML
     */
    renderCategoryBreakdown(report) {
        const categories = Object.entries(report.expensesByCategory);
        
        if (categories.length === 0) {
            return '';
        }

        categories.sort((a, b) => b[1] - a[1]);

        const categoryIcons = {
            'Moradia': '🏠',
            'Alimentação': '🍔',
            'Transporte': '🚗',
            'Saúde': '💊',
            'Educação': '📚',
            'Lazer': '🎮',
            'Vestuário': '👔',
            'Outros': '📦'
        };

        return `
            <div class="category-breakdown-container">
                <h3>📊 Detalhamento por Categoria</h3>
                <div class="category-breakdown-list">
                    ${categories.map(([category, value]) => {
                        const percentage = ((value / report.totalExpenses) * 100).toFixed(1);
                        const icon = categoryIcons[category] || '💰';
                        
                        return `
                            <div class="category-breakdown-item">
                                <div class="category-breakdown-header">
                                    <div class="category-breakdown-info">
                                        <span class="category-icon-large">${icon}</span>
                                        <div>
                                            <h4>${category}</h4>
                                            <p class="category-percentage">${percentage}% do total</p>
                                        </div>
                                    </div>
                                    <div class="category-breakdown-value">
                                        R$ ${this.formatMoney(value)}
                                    </div>
                                </div>
                                <div class="category-progress-bar">
                                    <div class="category-progress-fill" style="width: ${percentage}%;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Initializes event listeners for chart interactivity
     * @returns {void}
     */
    initializeListeners() {
        const slices = document.querySelectorAll('.donut-slice');
        const tooltip = document.getElementById('donutTooltip');
        
        slices.forEach(slice => {
            slice.addEventListener('mouseenter', (e) => {
                slice.style.opacity = '1';
                slice.style.transform = 'scale(1.05)';
                slice.style.transformOrigin = 'center';
                slice.style.filter = 'brightness(1.1)';
                
                const category = slice.dataset.category;
                const value = parseFloat(slice.dataset.value);
                const percentage = slice.dataset.percentage;
                
                if (tooltip) {
                    tooltip.innerHTML = `
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${category}</div>
                        <div>R$ ${this.formatMoney(value)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-gray);">${percentage}%</div>
                    `;
                    tooltip.style.display = 'block';
                }
            });
            
            slice.addEventListener('mousemove', (e) => {
                if (tooltip) {
                    const rect = e.target.closest('.donut-chart-svg-container').getBoundingClientRect();
                    tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                    tooltip.style.top = (e.clientY - rect.top - 15) + 'px';
                }
            });
            
            slice.addEventListener('mouseleave', () => {
                slice.style.opacity = '0.9';
                slice.style.transform = 'scale(1)';
                slice.style.filter = 'brightness(1)';
                
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            });
        });
    }

    /**
     * Renders empty state when there's no financial data
     * @returns {string} Empty state HTML
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>Sem dados financeiros</h3>
                <p>Configure sua renda mensal para visualizar o relatório</p>
            </div>
        `;
    }

    /**
     * Formats numeric value to Brazilian monetary format
     * @param {number} value - Value to be formatted
     * @returns {string} Formatted value (e.g.: "1.234,56")
     */
    formatMoney(value) {
        return parseFloat(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}