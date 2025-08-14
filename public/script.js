// Fallback script.js - Works without Socket.IO
window.addEventListener('DOMContentLoaded', () => {
    let tasks = [];
    let currentUser = '';
    let draggedItemId = null;
    
    // Make global for sales-features.js integration
    window.tasks = tasks;
    window.currentUser = currentUser;
    window.renderTasks = renderTasks;
    window.createTaskElement = createTaskElement;
    window.deleteTask = deleteTask;

    const names = ['Adam', 'Nick', 'Omar'];
    currentUser = prompt('AGENT_IDENTIFICATION_REQUIRED:', 'Adam') || names[Math.floor(Math.random() * names.length)];
    window.currentUser = currentUser;
    
    // Mock connection status for UI
    function updateConnectionBadge(isConnected) {
        const badge = document.getElementById('connection-badge');
        badge.textContent = '[OFFLINE_MODE]';
        badge.className = 'connection-badge disconnected';
    }

    function updateOnlineUsers() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = `
            <div class="user-item">
                <div class="user-status"></div>
                <span>${currentUser} (YOU)</span>
            </div>
        `;
    }
    
    function addActivity(message) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.textContent = `> ${message}`;
        activityList.insertBefore(item, activityList.firstChild);
        
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }

    async function initializeApp() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Backend fetch failed');
            
            tasks = await response.json();
            window.tasks = tasks;
            renderTasks();
            
            document.getElementById('db-status').textContent = '[OFFLINE_MODE]';
            document.getElementById('db-status').className = 'text-yellow-400';
            addActivity('Offline mode - Changes save to server but no real-time sync');
            
            updateConnectionBadge(false);
            updateOnlineUsers();
        } catch (error) {
            console.error("[SYSTEM_ERROR] Failed to initialize:", error);
            document.getElementById('db-status').textContent = '[OFFLINE]';
            document.getElementById('db-status').className = 'text-red-400';
            addActivity('ERROR: Could not connect to backend.');
        }
    }

    function renderTasks() {
        const containers = {
            todo: document.getElementById('todo-tasks'),
            inprogress: document.getElementById('inprogress-tasks'),
            negotiation: document.getElementById('negotiation-tasks'),
            done: document.getElementById('done-tasks')
        };

        Object.values(containers).forEach(c => {
            if (c) c.innerHTML = '';
        });

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            const container = containers[task.status];
            if (container) container.appendChild(taskElement);
        });
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card p-4 rounded-lg relative text-green-400';
        div.setAttribute('draggable', 'true');
        div.dataset.id = task.id;
        
        // Add priority styling
        if (task.priority) {
            div.setAttribute('data-priority', task.priority);
        }

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '[X]';
        deleteButton.className = 'delete-btn absolute top-2 right-2 px-2 py-1 text-xs rounded';
        deleteButton.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Add confirmation for important tasks
            if (task.deal_value > 5000) {
                if (!confirm(`Delete high-value task ($${task.deal_value})? This cannot be undone.`)) {
                    return;
                }
            }
            
            // Visual feedback
            deleteButton.textContent = '[...]';
            deleteButton.disabled = true;
            
            await deleteTask(task.id);
        };
        div.appendChild(deleteButton);

        // Add task type icon
        if (task.task_type && task.task_type !== 'general') {
            const taskIcon = document.createElement('div');
            taskIcon.className = 'task-icon';
            const icons = {
                'lead-generation': '🎯',
                'demo': '🖥️',
                'proposal': '📄',
                'follow-up': '📞',
                'contract': '✍️',
                'onboarding': '🚀'
            };
            taskIcon.textContent = icons[task.task_type] || '📋';
            div.appendChild(taskIcon);
        }
        
        // Add deal value badge
        if (task.deal_value && task.deal_value > 0) {
            const dealValue = document.createElement('div');
            dealValue.className = 'deal-value';
            dealValue.textContent = `$${parseInt(task.deal_value).toLocaleString()}`;
            div.appendChild(dealValue);
        }

        const content = document.createElement('p');
        content.textContent = `> ${task.text}`;
        content.className = 'pr-8 font-mono text-sm mt-6';
        div.appendChild(content);

        // Enhanced task metadata
        const metadata = document.createElement('div');
        metadata.className = 'mt-3 text-xs space-y-1';
        
        if (task.assignee) {
            const assigneeInfo = document.createElement('div');
            assigneeInfo.className = 'text-cyan-400';
            assigneeInfo.textContent = `AGENT_${task.assignee.toUpperCase()}`;
            metadata.appendChild(assigneeInfo);
        }
        
        if (task.due_date) {
            const dueDate = document.createElement('div');
            dueDate.className = 'text-yellow-400';
            const date = new Date(task.due_date);
            dueDate.textContent = `DUE: ${date.toLocaleDateString()}`;
            metadata.appendChild(dueDate);
        }
        
        if (task.priority && task.priority !== 'medium') {
            const priority = document.createElement('div');
            priority.className = task.priority === 'high' || task.priority === 'urgent' ? 'text-red-400' : 'text-green-400';
            priority.textContent = `PRIORITY: ${task.priority.toUpperCase()}`;
            metadata.appendChild(priority);
        }
        
        if (task.task_type && task.task_type !== 'general') {
            const taskType = document.createElement('div');
            taskType.className = 'text-purple-400';
            taskType.textContent = `TYPE: ${task.task_type.toUpperCase()}`;
            metadata.appendChild(taskType);
        }
        
        div.appendChild(metadata);
        
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        return div;
    }

    // Form submission
    document.getElementById('add-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const assigneeSelect = document.getElementById('assignee-select');
        const taskText = input.value.trim();
        const assignee = assigneeSelect.value;

        if (taskText) {
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: taskText,
                        assignee: assignee,
                        task_type: document.getElementById('task-type-select')?.value || 'general',
                        priority: document.getElementById('priority-select')?.value || 'medium',
                        deal_value: document.getElementById('deal-value-input')?.value || 0,
                        due_date: document.getElementById('due-date-input')?.value || null,
                        createdBy: currentUser
                    })
                });

                if (response.ok) {
                    const newTask = await response.json();
                    tasks.push(newTask);
                    window.tasks = tasks;
                    renderTasks();
                    input.value = '';
                    addActivity(`You created: "${taskText}"`);
                    if (window.notificationManager) {
                        window.notificationManager.success(`Task created: ${taskText}`);
                    }
                } else {
                    addActivity('ERROR: Failed to create task');
                    if (window.notificationManager) {
                        window.notificationManager.error('Failed to create task');
                    }
                }
            } catch (error) {
                addActivity('ERROR: Network error');
                if (window.notificationManager) {
                    window.notificationManager.error('Network error - check connection');
                }
                console.error('Task creation error:', error);
            }
        }
    });
    
    async function deleteTask(taskId) {
        try {
            console.log(`Attempting to delete task: ${taskId}`);
            
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                tasks = tasks.filter(t => t.id !== taskId);
                window.tasks = tasks;
                renderTasks();
                addActivity('✅ Task deleted successfully');
                console.log(`Task ${taskId} deleted successfully`);
            } else {
                const errorText = await response.text();
                console.error('Delete failed:', response.status, errorText);
                addActivity(`❌ ERROR: Failed to delete task (${response.status})`);
            }
        } catch (error) {
            console.error('Task deletion error:', error);
            addActivity('❌ ERROR: Network error during deletion');
        }
    }
    
    function handleDragStart(e) {
        e.target.classList.add('dragging');
        draggedItemId = e.target.dataset.id;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedItemId = null;
    }

    // Drag & Drop
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });
        
        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            if (!draggedItemId) return;
            
            const newStatus = column.id;
            const task = tasks.find(t => t.id === draggedItemId);
            
            if (task && task.status !== newStatus) {
                // Use REST API directly for better reliability
                try {
                    const response = await fetch(`/api/tasks/${draggedItemId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                            body: JSON.stringify({
                                status: newStatus
                            })
                        });

                        if (response.ok) {
                            task.status = newStatus;
                            task.updated_at = new Date().toISOString();
                            window.tasks = tasks;
                            renderTasks();
                            addActivity(`✅ Moved task to ${newStatus.toUpperCase()}`);
                            
                            if (newStatus === 'done') {
                                triggerGlitchConfetti();
                            } else if (newStatus === 'negotiation') {
                                addActivity('🔥 Task moved to CLOSING phase!');
                            }
                        } else {
                            const errorText = await response.text();
                            console.error('Move failed:', errorText);
                            addActivity('❌ ERROR: Failed to move task - ' + errorText);
                            renderTasks(); // Re-render to show original position
                        }
                    } catch (error) {
                        addActivity('ERROR: Network error');
                        console.error('Task move error:', error);
                    }
                }
            }
        });
    });
    
    // Confetti function
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];

    function triggerGlitchConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        confettiParticles = [];
        
        for (let i = 0; i < 50; i++) {
            confettiParticles.push(createDigitalParticle());
        }
        
        animateDigitalConfetti();
    }

    function createDigitalParticle() {
        const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00'];
        return {
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 15 + 5,
            speed: Math.random() * 5 + 2,
            angle: Math.random() * 360,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: Math.random() > 0.5 ? 'square' : 'line'
        };
    }

    function animateDigitalConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        confettiParticles.forEach((p, index) => {
            p.y += p.speed;
            p.x += Math.sin(p.angle) * 2;
            p.angle += 0.1;

            confettiCtx.fillStyle = p.color;
            confettiCtx.strokeStyle = p.color;
            confettiCtx.lineWidth = 2;
            
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.angle);
            
            if (p.type === 'square') {
                confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            } else {
                confettiCtx.beginPath();
                confettiCtx.moveTo(-p.size/2, 0);
                confettiCtx.lineTo(p.size/2, 0);
                confettiCtx.stroke();
            }
            confettiCtx.restore();

            if (p.y > confettiCanvas.height) confettiParticles.splice(index, 1);
        });

        if (confettiParticles.length > 0) {
            requestAnimationFrame(animateDigitalConfetti);
        } else {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        const dateString = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).replace(/\//g, '.');
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.textContent = `${dateString} // ${timeString}`;
        }
    }

    setInterval(updateTime, 1000);
    updateTime();
    initializeApp();
});

// Clock display
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const dateString = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
    const timeEl = document.getElementById('time');
    if (timeEl) {
        timeEl.textContent = `${dateString} // ${timeString}`;
    }
}

// Mega glitch effect
function triggerMegaGlitch() {
    document.body.style.animation = 'mega-glitch 0.5s';
    setTimeout(() => { document.body.style.animation = ''; }, 500);
    console.log('%c[SYSTEM_BREACH] MEGA_GLITCH_ACTIVATED', 'color: #00ff00; font-size: 20px;');
}