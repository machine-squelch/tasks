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

// Mega glitch effect when clicking logo
function triggerMegaGlitch() {
    document.body.style.animation = 'mega-glitch 0.5s';
    
    // CRT degauss effect
    const crtScreen = document.querySelector('.crt-screen');
    if (crtScreen) {
        crtScreen.style.animation = 'crt-degauss 1s ease-out';
        setTimeout(() => {
            crtScreen.style.animation = 'crt-flicker 0.15s infinite';
        }, 1000);
    }
    
    // Add temporary glitch class to everything
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        el.style.animation = 'corrupt 0.5s';
    });
    
    // Flash screen colors
    const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff0000'];
    let colorIndex = 0;
    const flashInterval = setInterval(() => {
        document.body.style.backgroundColor = colors[colorIndex];
        colorIndex++;
        if (colorIndex >= colors.length) {
            clearInterval(flashInterval);
            document.body.style.backgroundColor = '';
            document.body.style.animation = '';
            elements.forEach(el => {
                el.style.animation = '';
            });
        }
    }, 100);
    
    // Console effect
    console.log('%c[SYSTEM_BREACH] MEGA_GLITCH_ACTIVATED', 'color: #00ff00; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #00ff00;');
    console.log('%c[CRT_DEGAUSS] MAGNETIC_FIELD_RESET', 'color: #00ffff;');
}

window.addEventListener('DOMContentLoaded', () => {
    let tasks = [];
    let socket;
    let currentUser = '';
    let isTyping = false;
    let typingTimeout;
    let draggedItemId = null;
    
    // Ask for user name
    const names = ['Adam', 'Nick', 'Omar'];
    currentUser = prompt('AGENT_IDENTIFICATION_REQUIRED:', 'Adam') || names[Math.floor(Math.random() * names.length)];
    
    // Initialize Socket.IO connection
    function initializeSocket() {
        const socketUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8080' 
            : window.location.origin;
            
        socket = io(socketUrl);
        
        // --- Centralized Event Listeners ---
        
        socket.on('connect', () => {
            console.log('[SOCKET] Connected to war room');
            updateConnectionBadge(true);
            socket.emit('user:join', { name: currentUser });
        });
        
        socket.on('disconnect', () => {
            console.log('[SOCKET] Disconnected from war room');
            updateConnectionBadge(false);
        });
        
        socket.on('users:update', updateOnlineUsers);
        
        socket.on('task:created', (data) => {
            tasks.push(data.task);
            renderTasks();
            addActivity(data.user === currentUser ? `You created: "${data.task.text}"` : `${data.user} created: "${data.task.text}"`);
        });
        
        socket.on('task:moved', (data) => {
            const task = tasks.find(t => t.id === data.taskId);
            if (task) {
                task.status = data.newStatus;
                renderTasks();
                if (data.movedBy === currentUser) {
                    addActivity(`You moved task to ${data.newStatus.toUpperCase()}`);
                    if (data.newStatus === 'done') triggerGlitchConfetti();
                } else {
                    addActivity(`${data.movedBy} moved task to ${data.newStatus.toUpperCase()}`);
                }
            }
        });
        
        socket.on('task:deleted', (data) => {
            tasks = tasks.filter(t => t.id !== data.taskId);
            renderTasks();
            addActivity(data.deletedBy === currentUser ? 'You purged a task' : `${data.deletedBy} purged a task`);
        });
        
        socket.on('typing:update', updateTypingIndicator);
        
        socket.on('task:drag:other', (data) => {
            const taskEl = document.querySelector(`[data-id="${data.taskId}"]`);
            if (taskEl) {
                taskEl.classList.add('dragged-by-other');
                taskEl.setAttribute('title', `${data.user} is moving this`);
            }
        });
        
        socket.on('task:drag:other:end', (data) => {
            const taskEl = document.querySelector(`[data-id="${data.taskId}"]`);
            if (taskEl) {
                taskEl.classList.remove('dragged-by-other');
                taskEl.removeAttribute('title');
            }
        });
        
        socket.on('celebration', (data) => {
            if (data.user !== currentUser) {
                triggerGlitchConfetti();
                addActivity(`🎉 ${data.user} completed a task!`);
            }
        });
        
        socket.on('notification', (data) => addActivity(data.message));
    }
    
    // --- UI Update Functions ---

    function updateConnectionBadge(isConnected) {
        const badge = document.getElementById('connection-badge');
        if (isConnected) {
            badge.textContent = '[LIVE_SYNC_ACTIVE]';
            badge.className = 'connection-badge';
        } else {
            badge.textContent = '[CONNECTION_LOST]';
            badge.className = 'connection-badge disconnected';
        }
    }

    function updateOnlineUsers(users) {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-status"></div>
                <span>${user.name}${user.name === currentUser ? ' (YOU)' : ''}</span>
            </div>
        `).join('');
    }
    
    function updateTypingIndicator(typingUsers) {
        const indicator = document.getElementById('typing-indicator');
        const text = document.getElementById('typing-text');
        const activeTypers = typingUsers.filter(u => u !== currentUser);
        
        if (activeTypers.length > 0) {
            indicator.style.display = 'block';
            text.textContent = `[${activeTypers.join(', ')} TYPING...]`;
        } else {
            indicator.style.display = 'none';
        }
    }
    
    function addActivity(message) {
        const activityList = document.getElementById('activity-list');
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
            initializeSocket();
            
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Backend fetch failed');
            
            tasks = await response.json();
            renderTasks();
            document.getElementById('db-status').textContent = '[WAR_ROOM_ONLINE]';
            document.getElementById('db-status').className = 'text-green-400';
            addActivity('System initialized. Welcome to the war room.');
        } catch (error) {
            console.error("[SYSTEM_ERROR] Failed to initialize:", error);
            document.getElementById('db-status').textContent = '[OFFLINE]';
            document.getElementById('db-status').className = 'text-red-400';
            addActivity('ERROR: Could not connect to backend.');
        }
    }

    function renderTasks() {
        const todoContainer = document.getElementById('todo-tasks');
        const inprogressContainer = document.getElementById('inprogress-tasks');
        const doneContainer = document.getElementById('done-tasks');

        todoContainer.innerHTML = '';
        inprogressContainer.innerHTML = '';
        doneContainer.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            switch (task.status) {
                case 'inprogress': inprogressContainer.appendChild(taskElement); break;
                case 'done': doneContainer.appendChild(taskElement); break;
                default: todoContainer.appendChild(taskElement); break;
            }
        });
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card p-4 rounded-lg relative text-green-400';
        div.setAttribute('draggable', 'true');
        div.dataset.id = task.id;

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '[X]';
        deleteButton.className = 'delete-btn absolute top-2 right-2 px-2 py-1 text-xs rounded';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        };
        div.appendChild(deleteButton);

        const content = document.createElement('p');
        content.textContent = `> ${task.text}`;
        content.className = 'pr-8 font-mono text-sm';
        div.appendChild(content);

        if (task.assignee) {
            const assigneeInfo = document.createElement('div');
            assigneeInfo.className = 'mt-3 text-xs text-cyan-400';
            assigneeInfo.textContent = `AGENT_${task.assignee.toUpperCase()}`;
            div.appendChild(assigneeInfo);
        }
        
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        return div;
    }

    // --- User Action Handlers ---

    document.getElementById('add-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const assigneeSelect = document.getElementById('assignee-select');
        const taskText = input.value.trim();
        const assignee = assigneeSelect.value;

        if (taskText && socket && socket.connected) {
            socket.emit('task:create', { text: taskText, assignee: assignee });
            input.value = '';
            socket.emit('typing:stop');
        } else if (!socket.connected) {
            addActivity("ERROR: Connection lost. Cannot create task.");
        }
    });
    
    document.getElementById('task-input').addEventListener('input', (e) => {
        if (!isTyping && e.target.value.length > 0 && socket && socket.connected) {
            isTyping = true;
            socket.emit('typing:start');
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            if (isTyping && socket && socket.connected) {
                isTyping = false;
                socket.emit('typing:stop');
            }
        }, 1000);
    });
    
    function deleteTask(taskId) {
        if (socket && socket.connected) {
            socket.emit('task:delete', { taskId: taskId });
        } else {
            addActivity("ERROR: Connection lost. Cannot delete task.");
        }
    }
    
    function handleDragStart(e) {
        draggedItemId = e.target.dataset.id;
        e.target.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        if (socket && socket.connected) {
            socket.emit('task:drag:start', { taskId: draggedItemId });
        }
    }

    function handleDragEnd(e) {
        e.target.style.opacity = '1';
        if (socket && socket.connected) {
            socket.emit('task:drag:end', { taskId: draggedItemId });
        }
        draggedItemId = null;
    }

    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });
        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            if (!draggedItemId) return;
            const newStatus = column.id;
            if (socket && socket.connected) {
                socket.emit('task:move', { taskId: draggedItemId, status: newStatus });
            }
        });
    });
    
    // --- Effects ---

    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];

    function triggerGlitchConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        confettiParticles = [];
        
        for (let i = 0; i < 100; i++) {
            confettiParticles.push(createDigitalParticle());
        }
        
        document.body.style.animation = 'flicker 0.5s';
        setTimeout(() => { document.body.style.animation = ''; }, 500);
        
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

    // --- Initializers ---
    setInterval(updateTime, 1000);
    updateTime();
    initializeApp();
});
