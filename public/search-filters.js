// Advanced Search and Filter System
class TaskSearchManager {
    constructor() {
        this.filters = {
            search: '',
            assignee: 'all',
            priority: 'all',
            taskType: 'all',
            status: 'all',
            dealValue: { min: 0, max: Infinity },
            dateRange: { start: null, end: null }
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.setupEventListeners();
        this.loadSavedFilters();
    }

    createSearchInterface() {
        const container = document.querySelector('.container');
        if (!container) return;

        const searchSection = document.createElement('div');
        searchSection.id = 'search-filters-section';
        searchSection.className = 'mb-6 neon-border rounded-xl p-4';
        searchSection.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-cyan-400 glitch" data-text="TASK_SEARCH_MATRIX">
                    TASK_SEARCH_MATRIX
                </h3>
                <div class="flex gap-2">
                    <button id="search-toggle" class="text-xs px-3 py-1 bg-cyan-900 border border-cyan-500 rounded text-cyan-400">
                        🔍 FILTERS
                    </button>
                    <button id="clear-filters" class="text-xs px-3 py-1 bg-red-900 border border-red-500 rounded text-red-400">
                        CLEAR
                    </button>
                </div>
            </div>
            
            <div id="search-controls" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 hidden">
                <!-- Search Input -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">SEARCH_QUERY:</label>
                    <input id="search-input" type="text" placeholder="Task text..." 
                        class="cyber-input w-full px-3 py-2 text-sm rounded">
                </div>
                
                <!-- Assignee Filter -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">AGENT_FILTER:</label>
                    <select id="assignee-filter" class="cyber-input w-full px-3 py-2 text-sm rounded">
                        <option value="all">All Agents</option>
                        <option value="Adam">Adam (AE)</option>
                        <option value="Nick">Nick (SDR)</option>
                        <option value="Omar">Omar (CS)</option>
                    </select>
                </div>
                
                <!-- Priority Filter -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">PRIORITY_LEVEL:</label>
                    <select id="priority-filter" class="cyber-input w-full px-3 py-2 text-sm rounded">
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                
                <!-- Task Type Filter -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">TASK_TYPE:</label>
                    <select id="tasktype-filter" class="cyber-input w-full px-3 py-2 text-sm rounded">
                        <option value="all">All Types</option>
                        <option value="lead-generation">Lead Generation</option>
                        <option value="demo">Demo</option>
                        <option value="proposal">Proposal</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="contract">Contract</option>
                        <option value="onboarding">Onboarding</option>
                    </select>
                </div>
                
                <!-- Deal Value Range -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">MIN_DEAL_VALUE:</label>
                    <input id="min-value" type="number" placeholder="0" 
                        class="cyber-input w-full px-3 py-2 text-sm rounded">
                </div>
                
                <div>
                    <label class="block text-xs text-green-400 mb-1">MAX_DEAL_VALUE:</label>
                    <input id="max-value" type="number" placeholder="No limit" 
                        class="cyber-input w-full px-3 py-2 text-sm rounded">
                </div>
                
                <!-- Sort Options -->
                <div>
                    <label class="block text-xs text-green-400 mb-1">SORT_BY:</label>
                    <select id="sort-by" class="cyber-input w-full px-3 py-2 text-sm rounded">
                        <option value="created_at">Created Date</option>
                        <option value="updated_at">Updated Date</option>
                        <option value="due_date">Due Date</option>
                        <option value="deal_value">Deal Value</option>
                        <option value="priority">Priority</option>
                        <option value="text">Task Text</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs text-green-400 mb-1">SORT_ORDER:</label>
                    <select id="sort-order" class="cyber-input w-full px-3 py-2 text-sm rounded">
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>
            
            <!-- Results Summary -->
            <div id="search-results" class="mt-4 text-xs text-cyan-600 hidden">
                <span id="results-count">0 tasks found</span> | 
                <span id="results-summary">No filters applied</span>
            </div>
        `;

        // Insert before the kanban board
        const kanbanBoard = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
        if (kanbanBoard) {
            container.insertBefore(searchSection, kanbanBoard);
        }
    }

    setupEventListeners() {
        // Toggle search controls
        const toggleBtn = document.getElementById('search-toggle');
        const controls = document.getElementById('search-controls');
        const results = document.getElementById('search-results');
        
        if (toggleBtn && controls) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = controls.classList.contains('hidden');
                controls.classList.toggle('hidden');
                results.classList.toggle('hidden');
                toggleBtn.textContent = isHidden ? '🔼 HIDE' : '🔍 FILTERS';
            });
        }

        // Clear filters
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }

        // Filter inputs
        const filterInputs = [
            'search-input', 'assignee-filter', 'priority-filter', 
            'tasktype-filter', 'min-value', 'max-value', 
            'sort-by', 'sort-order'
        ];

        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const event = element.type === 'text' || element.type === 'number' ? 'input' : 'change';
                element.addEventListener(event, () => this.updateFilters());
            }
        });
    }

    updateFilters() {
        // Update filter values
        this.filters.search = document.getElementById('search-input')?.value.toLowerCase() || '';
        this.filters.assignee = document.getElementById('assignee-filter')?.value || 'all';
        this.filters.priority = document.getElementById('priority-filter')?.value || 'all';
        this.filters.taskType = document.getElementById('tasktype-filter')?.value || 'all';
        
        const minValue = document.getElementById('min-value')?.value;
        const maxValue = document.getElementById('max-value')?.value;
        this.filters.dealValue = {
            min: minValue ? parseFloat(minValue) : 0,
            max: maxValue ? parseFloat(maxValue) : Infinity
        };

        this.sortBy = document.getElementById('sort-by')?.value || 'created_at';
        this.sortOrder = document.getElementById('sort-order')?.value || 'desc';

        // Apply filters and render
        this.applyFiltersAndRender();
        this.saveFilters();
    }

    applyFiltersAndRender() {
        if (!window.tasks) return;

        let filteredTasks = window.tasks.slice();

        // Apply search filter
        if (this.filters.search) {
            filteredTasks = filteredTasks.filter(task =>
                task.text.toLowerCase().includes(this.filters.search) ||
                task.assignee.toLowerCase().includes(this.filters.search) ||
                (task.task_type && task.task_type.toLowerCase().includes(this.filters.search))
            );
        }

        // Apply assignee filter
        if (this.filters.assignee !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.assignee === this.filters.assignee);
        }

        // Apply priority filter
        if (this.filters.priority !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === this.filters.priority);
        }

        // Apply task type filter
        if (this.filters.taskType !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.task_type === this.filters.taskType);
        }

        // Apply deal value filter
        filteredTasks = filteredTasks.filter(task => {
            const dealValue = parseFloat(task.deal_value) || 0;
            return dealValue >= this.filters.dealValue.min && dealValue <= this.filters.dealValue.max;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // Handle different data types
            if (this.sortBy === 'deal_value') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (this.sortBy === 'priority') {
                const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
                aValue = priorityOrder[aValue] || 0;
                bValue = priorityOrder[bValue] || 0;
            } else if (this.sortBy.includes('_at') || this.sortBy === 'due_date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Update results summary
        this.updateResultsSummary(filteredTasks.length);

        // Render filtered tasks
        this.renderFilteredTasks(filteredTasks);
    }

    renderFilteredTasks(filteredTasks) {
        // Clear all columns
        const containers = {
            todo: document.getElementById('todo-tasks'),
            inprogress: document.getElementById('inprogress-tasks'),
            negotiation: document.getElementById('negotiation-tasks'),
            done: document.getElementById('done-tasks')
        };

        Object.values(containers).forEach(container => {
            if (container) container.innerHTML = '';
        });

        // Group tasks by status and render
        filteredTasks.forEach(task => {
            if (window.createTaskElement) {
                const taskElement = window.createTaskElement(task);
                const container = containers[task.status];
                if (container && taskElement) {
                    container.appendChild(taskElement);
                }
            }
        });
    }

    updateResultsSummary(count) {
        const countEl = document.getElementById('results-count');
        const summaryEl = document.getElementById('results-summary');
        
        if (countEl) {
            countEl.textContent = `${count} task${count !== 1 ? 's' : ''} found`;
        }

        if (summaryEl) {
            const activeFilters = [];
            if (this.filters.search) activeFilters.push(`Search: "${this.filters.search}"`);
            if (this.filters.assignee !== 'all') activeFilters.push(`Agent: ${this.filters.assignee}`);
            if (this.filters.priority !== 'all') activeFilters.push(`Priority: ${this.filters.priority}`);
            if (this.filters.taskType !== 'all') activeFilters.push(`Type: ${this.filters.taskType}`);
            if (this.filters.dealValue.min > 0 || this.filters.dealValue.max < Infinity) {
                activeFilters.push(`Value: $${this.filters.dealValue.min}${this.filters.dealValue.max < Infinity ? ` - $${this.filters.dealValue.max}` : '+'}`);
            }

            summaryEl.textContent = activeFilters.length > 0 
                ? activeFilters.join(' | ') 
                : 'No filters applied';
        }
    }

    clearAllFilters() {
        // Reset filter values
        this.filters = {
            search: '',
            assignee: 'all',
            priority: 'all',
            taskType: 'all',
            status: 'all',
            dealValue: { min: 0, max: Infinity },
            dateRange: { start: null, end: null }
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';

        // Reset UI
        const inputs = {
            'search-input': '',
            'assignee-filter': 'all',
            'priority-filter': 'all',
            'tasktype-filter': 'all',
            'min-value': '',
            'max-value': '',
            'sort-by': 'created_at',
            'sort-order': 'desc'
        };

        Object.entries(inputs).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        // Re-render all tasks
        if (window.renderTasks) {
            window.renderTasks();
        }

        this.updateResultsSummary(window.tasks ? window.tasks.length : 0);
        this.saveFilters();

        // Show notification
        if (window.notificationManager) {
            window.notificationManager.info('All filters cleared');
        }
    }

    saveFilters() {
        try {
            const filterState = {
                filters: this.filters,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            };
            localStorage.setItem('dluxe_search_filters', JSON.stringify(filterState));
        } catch (error) {
            console.warn('Could not save filters:', error);
        }
    }

    loadSavedFilters() {
        try {
            const saved = localStorage.getItem('dluxe_search_filters');
            if (saved) {
                const filterState = JSON.parse(saved);
                this.filters = { ...this.filters, ...filterState.filters };
                this.sortBy = filterState.sortBy || 'created_at';
                this.sortOrder = filterState.sortOrder || 'desc';
            }
        } catch (error) {
            console.warn('Could not load saved filters:', error);
        }
    }

    // Public API for other components
    getCurrentFilters() {
        return {
            filters: { ...this.filters },
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
    }

    setFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        this.applyFiltersAndRender();
    }
}

// Initialize search manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other components to load
    setTimeout(() => {
        window.taskSearchManager = new TaskSearchManager();
        console.log('[SEARCH_SYSTEM] Advanced search and filtering enabled');
    }, 1000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskSearchManager;
}