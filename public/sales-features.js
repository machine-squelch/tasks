// Sales-Features.js - Enhanced sales functionality for DLuxe Task Tracker
// Comprehensive sales-specific features with proper error handling

class SalesManager {
    constructor() {
        this.mockData = {
            pipeline: 250000,
            activeDeals: 12,
            weekRevenue: 45000,
            quotaProgress: 67,
            leaderboard: [
                { name: 'Adam', deals: 8, revenue: 125000 },
                { name: 'Nick', deals: 15, revenue: 89000 },
                { name: 'Omar', deals: 6, revenue: 78000 }
            ]
        };
        this.initializeSalesFeatures();
    }

    initializeSalesFeatures() {
        this.updateMetrics();
        this.setupEventListeners();
        this.startMetricsPolling();
        console.log('[SALES_SYSTEM] Sales features initialized');
    }

    updateMetrics() {
        try {
            // Update main dashboard metrics
            const elements = {
                'total-pipeline': this.mockData.pipeline.toLocaleString(),
                'active-deals': this.mockData.activeDeals,
                'week-revenue': this.mockData.weekRevenue.toLocaleString(),
                'quota-progress': this.mockData.quotaProgress
            };

            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = value;
                    this.animateValueChange(el);
                }
            });

            // Update daily stats
            this.updateDailyStats();
            this.updateLeaderboard();
        } catch (error) {
            console.error('[SALES_ERROR] Failed to update metrics:', error);
        }
    }

    updateDailyStats() {
        try {
            const tasksToday = document.querySelectorAll('.task-card').length;
            const dealsToday = Math.floor(this.mockData.weekRevenue / 7);
            
            const tasksEl = document.getElementById('tasks-today');
            const dealsEl = document.getElementById('deals-today');
            
            if (tasksEl) tasksEl.textContent = tasksToday;
            if (dealsEl) dealsEl.textContent = dealsToday.toLocaleString();
        } catch (error) {
            console.error('[SALES_ERROR] Failed to update daily stats:', error);
        }
    }

    updateLeaderboard() {
        try {
            const leaderboardList = document.getElementById('leaderboard-list');
            if (!leaderboardList) return;

            leaderboardList.innerHTML = this.mockData.leaderboard
                .sort((a, b) => b.revenue - a.revenue)
                .map((agent, index) => `
                    <div class="leaderboard-item text-xs">
                        <span class="text-yellow-400">
                            ${index + 1}. ${agent.name}
                        </span>
                        <span class="text-green-400">
                            $${agent.revenue.toLocaleString()}
                        </span>
                    </div>
                `).join('');
        } catch (error) {
            console.error('[SALES_ERROR] Failed to update leaderboard:', error);
        }
    }

    animateValueChange(element) {
        if (!element) return;
        
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    setupEventListeners() {
        // Enhanced task form with sales fields
        this.enhanceTaskForm();
        
        // Quick action buttons
        this.setupQuickActions();
        
        // CRM sync simulation
        this.setupCRMSync();
    }

    enhanceTaskForm() {
        try {
            const form = document.getElementById('add-task-form');
            if (!form) return;

            const originalSubmit = form.onsubmit;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const taskData = {
                    text: document.getElementById('task-input').value.trim(),
                    assignee: document.getElementById('assignee-select').value,
                    task_type: document.getElementById('task-type-select').value,
                    priority: document.getElementById('priority-select').value,
                    deal_value: document.getElementById('deal-value-input').value,
                    due_date: document.getElementById('due-date-input').value,
                    createdBy: window.currentUser || 'Unknown'
                };

                if (!taskData.text || !taskData.assignee) {
                    this.showNotification('Task text and assignee are required', 'error');
                    return;
                }

                try {
                    await this.createEnhancedTask(taskData);
                    this.resetForm(form);
                    this.showNotification('Task created successfully!', 'success');
                } catch (error) {
                    console.error('[SALES_ERROR] Task creation failed:', error);
                    this.showNotification('Failed to create task', 'error');
                }
            });
        } catch (error) {
            console.error('[SALES_ERROR] Failed to enhance task form:', error);
        }
    }

    async createEnhancedTask(taskData) {
        // This would integrate with the Socket.IO implementation
        // For now, we'll emit a custom event with enhanced data
        if (window.socket && window.socket.connected) {
            window.socket.emit('task:create', {
                ...taskData,
                operationId: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
        } else {
            // Fallback to REST API
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create task via API');
            }
            
            // Trigger UI update if we have access to the render function
            if (window.renderTasks) {
                const newTask = await response.json();
                window.tasks = window.tasks || [];
                window.tasks.push(newTask);
                window.renderTasks();
            }
        }
    }

    setupQuickActions() {
        // Quick task creation buttons
        window.createQuickTask = (type) => {
            try {
                const templates = {
                    'demo': {
                        text: 'Schedule product demo with prospect',
                        task_type: 'demo',
                        priority: 'high'
                    },
                    'follow-up': {
                        text: 'Follow up on proposal sent last week',
                        task_type: 'follow-up',
                        priority: 'medium'
                    },
                    'proposal': {
                        text: 'Create customized proposal for prospect',
                        task_type: 'proposal',
                        priority: 'high'
                    }
                };

                const template = templates[type];
                if (template) {
                    this.populateTaskForm(template);
                    this.showNotification(`${type.toUpperCase()} template loaded`, 'info');
                }
            } catch (error) {
                console.error('[SALES_ERROR] Quick task creation failed:', error);
                this.showNotification('Failed to create quick task', 'error');
            }
        };

        // Sales report generation
        window.generateSalesReport = () => {
            try {
                const report = this.generateWeeklyReport();
                this.displaySalesReport(report);
                this.showNotification('Weekly sales report generated', 'success');
            } catch (error) {
                console.error('[SALES_ERROR] Report generation failed:', error);
                this.showNotification('Failed to generate report', 'error');
            }
        };
    }

    populateTaskForm(template) {
        try {
            const elements = {
                'task-input': template.text,
                'task-type-select': template.task_type,
                'priority-select': template.priority,
                'deal-value-input': template.deal_value || '',
                'due-date-input': template.due_date || this.getDefaultDueDate()
            };

            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value !== undefined) {
                    el.value = value;
                }
            });

            // Focus on the task input for editing
            const taskInput = document.getElementById('task-input');
            if (taskInput) {
                taskInput.focus();
                taskInput.select();
            }
        } catch (error) {
            console.error('[SALES_ERROR] Failed to populate form:', error);
        }
    }

    getDefaultDueDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Default to 1 week from now
        return date.toISOString().split('T')[0];
    }

    setupCRMSync() {
        window.syncCRM = async () => {
            try {
                this.showNotification('Syncing with CRM...', 'info');
                
                // Simulate CRM sync delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Update sync badge
                const syncBadge = document.getElementById('crm-sync-badge');
                if (syncBadge) {
                    syncBadge.textContent = '[CRM_SYNC_COMPLETE]';
                    syncBadge.className = 'fixed top-20 right-20 px-3 py-1 bg-green-900 border border-green-500 rounded text-green-400 text-xs';
                    
                    setTimeout(() => {
                        syncBadge.textContent = '[CRM_SYNC_ACTIVE]';
                        syncBadge.className = 'fixed top-20 right-20 px-3 py-1 bg-purple-900 border border-purple-500 rounded text-purple-400 text-xs';
                    }, 3000);
                }
                
                // Simulate data updates
                this.mockData.pipeline += Math.floor(Math.random() * 50000);
                this.mockData.activeDeals += Math.floor(Math.random() * 3);
                this.updateMetrics();
                
                this.showNotification('CRM sync completed successfully', 'success');
            } catch (error) {
                console.error('[SALES_ERROR] CRM sync failed:', error);
                this.showNotification('CRM sync failed', 'error');
            }
        };
    }

    generateWeeklyReport() {
        try {
            const tasks = document.querySelectorAll('.task-card');
            const report = {
                totalTasks: tasks.length,
                tasksByStatus: {
                    todo: document.querySelectorAll('#todo-tasks .task-card').length,
                    inprogress: document.querySelectorAll('#inprogress-tasks .task-card').length,
                    negotiation: document.querySelectorAll('#negotiation-tasks .task-card').length,
                    done: document.querySelectorAll('#done-tasks .task-card').length
                },
                pipeline: this.mockData.pipeline,
                weekRevenue: this.mockData.weekRevenue,
                quotaProgress: this.mockData.quotaProgress,
                timestamp: new Date().toISOString()
            };

            return report;
        } catch (error) {
            console.error('[SALES_ERROR] Failed to generate report:', error);
            return null;
        }
    }

    displaySalesReport(report) {
        if (!report) return;

        try {
            const reportWindow = window.open('', '_blank', 'width=600,height=400');
            reportWindow.document.write(`
                <html>
                    <head>
                        <title>Weekly Sales Report</title>
                        <style>
                            body { font-family: 'Courier New', monospace; background: #000; color: #00ff00; padding: 20px; }
                            .header { color: #00ffff; font-size: 18px; margin-bottom: 20px; }
                            .section { margin: 15px 0; padding: 10px; border: 1px solid #00ff00; }
                            .metric { margin: 5px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="header">📊 WEEKLY SALES REPORT</div>
                        <div class="section">
                            <div class="metric">Total Tasks: ${report.totalTasks}</div>
                            <div class="metric">Prospecting: ${report.tasksByStatus.todo}</div>
                            <div class="metric">Active Deals: ${report.tasksByStatus.inprogress}</div>
                            <div class="metric">Negotiation: ${report.tasksByStatus.negotiation}</div>
                            <div class="metric">Closed: ${report.tasksByStatus.done}</div>
                        </div>
                        <div class="section">
                            <div class="metric">Pipeline Value: $${report.pipeline.toLocaleString()}</div>
                            <div class="metric">Week Revenue: $${report.weekRevenue.toLocaleString()}</div>
                            <div class="metric">Quota Progress: ${report.quotaProgress}%</div>
                        </div>
                        <div style="margin-top: 20px; font-size: 12px; color: #666;">
                            Generated: ${new Date(report.timestamp).toLocaleString()}
                        </div>
                    </body>
                </html>
            `);
            reportWindow.document.close();
        } catch (error) {
            console.error('[SALES_ERROR] Failed to display report:', error);
        }
    }

    showNotification(message, type = 'info') {
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `sales-notification ${type}`;
            notification.textContent = message;
            
            // Style the notification
            const colors = {
                success: { bg: 'rgba(0, 255, 0, 0.2)', border: '#00ff00', text: '#00ff00' },
                error: { bg: 'rgba(255, 0, 0, 0.2)', border: '#ff0000', text: '#ff0000' },
                info: { bg: 'rgba(0, 255, 255, 0.2)', border: '#00ffff', text: '#00ffff' }
            };
            
            const color = colors[type] || colors.info;
            
            Object.assign(notification.style, {
                position: 'fixed',
                top: '80px',
                right: '20px',
                padding: '10px 15px',
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: '5px',
                color: color.text,
                fontSize: '12px',
                fontFamily: '"Share Tech Mono", monospace',
                zIndex: '10000',
                animation: 'slideIn 0.3s ease-out'
            });
            
            document.body.appendChild(notification);
            
            // Auto-remove notification
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        } catch (error) {
            console.error('[SALES_ERROR] Failed to show notification:', error);
        }
    }

    resetForm(form) {
        try {
            form.reset();
            // Reset to default values
            const defaults = {
                'task-type-select': 'general',
                'assignee-select': 'Adam',
                'priority-select': 'medium'
            };
            
            Object.entries(defaults).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });
        } catch (error) {
            console.error('[SALES_ERROR] Failed to reset form:', error);
        }
    }

    startMetricsPolling() {
        // Update metrics every 30 seconds with small variations
        setInterval(() => {
            try {
                // Small random variations to simulate live data
                this.mockData.pipeline += Math.floor(Math.random() * 10000 - 5000);
                this.mockData.weekRevenue += Math.floor(Math.random() * 5000 - 2500);
                this.mockData.quotaProgress = Math.min(100, Math.max(0, 
                    this.mockData.quotaProgress + Math.floor(Math.random() * 6 - 3)
                ));
                
                this.updateMetrics();
            } catch (error) {
                console.error('[SALES_ERROR] Metrics polling error:', error);
            }
        }, 30000);
    }
}

// Leaderboard toggle function
window.toggleLeaderboard = () => {
    try {
        const panel = document.getElementById('leaderboard-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    } catch (error) {
        console.error('[SALES_ERROR] Failed to toggle leaderboard:', error);
    }
};

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .sales-notification {
        animation: slideIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Initialize sales manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.salesManager = new SalesManager();
        console.log('[SALES_SYSTEM] Sales management system loaded successfully');
    } catch (error) {
        console.error('[SALES_ERROR] Failed to initialize sales manager:', error);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SalesManager;
}