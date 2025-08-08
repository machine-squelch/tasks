/*
 * DATABASE CONFIGURATION
 * ======================
 * Current: IndexedDB (browser-based storage)
 * - Data persists locally in user's browser
 * - No server needed, works offline
 * - Data is per-device (no sync between devices)
 * * IMPORTANT: Place dllogoonly.png in the same directory as index.html
 * For Digital Ocean deployment, put it in the public/ folder
 * * UPGRADE OPTIONS FOR BACKEND:
 * * Option 1: SQLite + Express.js (Simplest)
 * - npm install express sqlite3 cors
 * - Single file database, no config needed
 * - Perfect for small teams (<100 users)
 * * Option 2: Firebase Realtime Database (Easiest cloud)
 * - Real-time sync across devices
 * - No backend code needed
 * - Free tier: 1GB storage, 10GB/month transfer
 * * Option 3: Supabase (Open source Firebase alternative)
 * - PostgreSQL database
 * - Built-in auth & real-time
 * - Free tier: 500MB database, 2GB bandwidth
 * * To implement backend: Replace the fetch/add/update/delete functions
 * with actual API calls to your chosen backend.
 */

        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            // Wrap around screen
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
            
            // Random individual glitch
            this.glitchTimer--;
            if (this.glitchTimer <= 0) {
                this.x += (Math.random() - 0.5) * 50;  // BIGGER glitch jump
                this.y += (Math.random() - 0.5) * 50;
                this.glitchTimer = Math.random() * 200 + 100;
                this.isGlitched = true;
                this.color = Math.random() > 0.3 ? '#ff00ff' : '#ffff00';
                setTimeout(() => {
                    this.isGlitched = false;
                    this.color = Math.random() > 0.5 ? '#00ff00' : '#00ffff';
                }, 200);  // Longer glitch visibility
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            if (this.isGlitched) {
                // Draw glitched particle with RGB split - MORE VISIBLE
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x - 4, this.y, this.size, this.size);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.x, this.y, this.size, this.size);
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(this.x + 4, this.y, this.size, this.size);
            } else {
                // Add glow effect
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.size, this.size);
            }
            
            // Draw connection lines to nearby particles - MORE VISIBLE
            particles.forEach(other => {
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150 && distance > 0) {  // INCREASED range
                    ctx.strokeStyle = this.color;
                    ctx.globalAlpha = this.opacity * (1 - distance / 150) * 0.5;  // MORE OPAQUE lines
                    ctx.lineWidth = 1;  // THICKER lines
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            });
            ctx.restore();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Global glitch effect - MORE FREQUENT
        glitchTimer++;
        if (glitchTimer > 300) {  // More frequent than 500
            glitchTimer = 0;
            // Cause all particles to glitch
            particles.forEach(particle => {
                particle.x += (Math.random() - 0.5) * 100;  // BIGGER glitch
                particle.y += (Math.random() - 0.5) * 100;
            });
        }
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Clock display
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const dateString = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
    document.getElementById('time').textContent = `${dateString} // ${timeString}`;
}
setInterval(updateTime, 1000);
updateTime();

// Mega glitch effect when clicking logo
function triggerMegaGlitch() {
    document.body.style.animation = 'mega-glitch 0.5s';
    
    // CRT degauss effect
    const crtScreen = document.querySelector('.crt-screen');
    crtScreen.style.animation = 'crt-degauss 1s ease-out';
    setTimeout(() => {
        crtScreen.style.animation = 'crt-flicker 0.15s infinite';
    }, 1000);
    
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
    console.log('%c[CRT_DEGAUSS] MAGNETIC_FIELD_RESET', 'color: #00ffff; font-size: 16px;');
}

    // Initialize Socket.IO connection
    function initializeSocket() {
        const socketUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8080' 
            : window.location.origin;
            
        socket = io(socketUrl);
        
        // Connection events
        socket.on('connect', () => {
            console.log('[SOCKET] Connected to war room');
            document.getElementById('connection-badge').textContent = '[LIVE_SYNC_ACTIVE]';
            document.getElementById('connection-badge').className = 'connection-badge';
            
            // Join with user name
            socket.emit('user:join', { name: currentUser });
        });
        
        socket.on('disconnect', () => {
            console.log('[SOCKET] Disconnected from war room');
            document.getElementById('connection-badge').textContent = '[CONNECTION_LOST]';
            document.getElementById('connection-badge').className = 'connection-badge disconnected';
        });
        
        // User updates
        socket.on('users:update', (users) => {
            updateOnlineUsers(users);
        });
        
        // Task events
        // Replace this function in public/script.js
socket.on('task:created', (data) => {
    // Add the server-authoritative task to our local array
    tasks.push(data.task);
    renderTasks();

    // Log activity conditionally (with typo fixed)
    if (data.user === currentUser) {
        addActivity(`You created: "${data.task.text}"`);
    } else {
        addActivity(`${data.user} created: "${data.task.text}"`);
    }
});

        socket.on('task:moved', (data) => {
            if (data.movedBy !== currentUser) {
                const task = tasks.find(t => t.id === data.taskId);
                if (task) {
                    task.status = data.newStatus;
                    renderTasks();
                    addActivity(`${data.movedBy} moved task to ${data.newStatus.toUpperCase()}`);
                }
            }
        });
        
        socket.on('task:deleted', (data) => {
            if (data.deletedBy !== currentUser) {
                tasks = tasks.filter(t => t.id !== data.taskId);
                renderTasks();
                addActivity(`${data.deletedBy} purged a task`);
            }
        });
        
        // Typing indicators
        socket.on('typing:update', (typingUsers) => {
            updateTypingIndicator(typingUsers);
        });
        
        // Dragging indicators
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
        
        // Celebrations
        socket.on('celebration', (data) => {
            if (data.user !== currentUser) {
                triggerGlitchConfetti();
                addActivity(`🎉 ${data.user} completed a task!`);
            }
        });
        
        // Notifications
        socket.on('notification', (data) => {
            addActivity(data.message);
        });
        
        // Activity feed
        socket.on('activity', (data) => {
            // Activity already handled in specific events
        });
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
        
        if (typingUsers.length > 0) {
            indicator.style.display = 'block';
            text.textContent = `[${typingUsers.join(', ')} TYPING...]`;
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
        
        // Keep only last 10 activities
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }

    // Backend API configuration
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080/api'  // Local development
        : '/api';  // Production (same domain)
    
    let useBackend = true;  // Try backend first, fallback to IndexedDB if fails

    // Initialize IndexedDB for fallback storage
    const DB_NAME = 'DLuxeTaskDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'tasks';

    // Check backend connectivity
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return data.status === 'online';
        } catch (error) {
            console.log('[SYSTEM] Backend offline, using local storage');
            return false;
        }
    }

    // Initialize database (IndexedDB fallback)
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error("[DB_ERROR] Failed to open IndexedDB");
                reject(request.error);
            };
            
            request.onsuccess = () => {
                db = request.result;
                console.log("[DB_SUCCESS] IndexedDB initialized (fallback mode)");
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('assignee', 'assignee', { unique: false });
                    console.log("[DB_UPGRADE] IndexedDB store created");
                }
            };
        });
    }

    // Fetch all tasks - uses API for initial load
    async function fetchTasksFromAPI() {
        console.log("[SYSTEM] Loading task data...");
        
        // Try backend first
        if (useBackend) {
            try {
                const response = await fetch(`${API_URL}/tasks`);
                if (response.ok) {
                    const tasks = await response.json();
                    console.log(`[SYSTEM] Loaded ${tasks.length} tasks from backend`);
                    return tasks;
                }
            } catch (error) {
                console.log("[SYSTEM] Backend unavailable, using local storage");
                useBackend = false;
            }
        }
        
        // Fallback to IndexedDB
        if (!db) {
            console.log("[SYSTEM] No database available");
            return [];
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                const tasks = request.result;
                console.log(`[SYSTEM] Loaded ${tasks.length} tasks from local storage`);
                resolve(tasks);
            };
            
            request.onerror = () => {
                console.error("[DB_ERROR] Failed to fetch tasks");
                reject(request.error);
            };
        });
    }

    // Save task to IndexedDB (local backup)
    async function saveTaskToDB(taskData) {
        if (!db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.put(taskData);
            
            request.onsuccess = () => {
                console.log("[DB_SUCCESS] Task saved locally:", taskData.id);
                resolve(taskData);
            };
            
            request.onerror = () => {
                console.error("[DB_ERROR] Failed to save task");
                reject(request.error);
            };
        });
    }

    // Add new task - now uses Socket.IO
    async function addTaskToAPI(taskData) {
        console.log("[SYSTEM] Injecting task:", taskData);
        
        // Emit to socket for real-time sync
        if (socket && socket.connected) {
            socket.emit('task:create', taskData);
            
            // Optimistically add to local state
            const newTask = { 
                ...taskData, 
                id: `task-${Date.now()}`,
                createdBy: currentUser 
            };
            tasks.push(newTask);
            
            // Save local backup
            if (db) await saveTaskToDB(newTask);
            
            addActivity(`You created: "${taskData.text}"`);
            return newTask;
        } else {
            // Fallback to API if socket not connected
            try {
                const response = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                if (response.ok) {
                    const newTask = await response.json();
                    return newTask;
                }
            } catch (error) {
                console.log("[SYSTEM] Creating task locally only");
            }
            
            // Last resort: local only
            const newTask = { ...taskData, id: `task-${Date.now()}` };
            if (db) await saveTaskToDB(newTask);
            return newTask;
        }
    }

    // Update task status - now uses Socket.IO
    async function updateTaskInAPI(taskId, newStatus) {
        console.log(`[SYSTEM] Updating task ${taskId} to status ${newStatus}`);
        
        // Emit to socket for real-time sync
        if (socket && socket.connected) {
            socket.emit('task:move', { taskId, status: newStatus });
            
            // Optimistically update local state
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                if (db) await saveTaskToDB(task);
            }
            
            addActivity(`You moved task to ${newStatus.toUpperCase()}`);
            
            // Trigger local celebration if done
            if (newStatus === 'done') {
                triggerGlitchConfetti();
            }
        } else {
            // Fallback to API
            try {
                const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                if (!response.ok) throw new Error('Failed');
            } catch (error) {
                console.log("[SYSTEM] Updating locally only");
            }
            
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                if (db) await saveTaskToDB(task);
            }
        }
        return true;
    }
    
    // Delete task - now uses Socket.IO
    async function deleteTaskFromAPI(taskId) {
        console.log(`[SYSTEM] Purging task ${taskId}`);
        
        // Emit to socket for real-time sync
        if (socket && socket.connected) {
            socket.emit('task:delete', { taskId });
            
            // Optimistically remove from local state
            tasks = tasks.filter(t => t.id !== taskId);
            
            // Remove from local DB
            if (db) {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                objectStore.delete(taskId);
            }
            
            addActivity('You purged a task');
        } else {
            // Fallback to API
            try {
                const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                    method: 'DELETE'
                });
                if (!response.ok && response.status !== 204) throw new Error('Failed');
            } catch (error) {
                console.log("[SYSTEM] Deleting locally only");
            }
            
            tasks = tasks.filter(t => t.id !== taskId);
            
            if (db) {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                objectStore.delete(taskId);
            }
        }
        return true;
    }

    async function initializeApp() {
        try {
            // Initialize Socket.IO first for real-time features
            initializeSocket();
            
            // Check backend connectivity
            useBackend = await checkBackendConnection();
            
            if (useBackend) {
                document.getElementById('db-status').textContent = '[WAR_ROOM_ONLINE]';
                document.getElementById('db-status').className = 'text-green-400';
                console.log('[SYSTEM] Connected to backend server');
            } else {
                // Initialize IndexedDB as fallback
                await initDB();
                document.getElementById('db-status').textContent = '[LOCAL_MODE]';
                document.getElementById('db-status').className = 'text-yellow-400';
                console.log('[SYSTEM] Running in local mode');
            }
            
            tasks = await fetchTasksFromAPI();
            renderTasks();
            
            // Initial activity message
            addActivity('System initialized. Welcome to the war room.');
        } catch (error) {
            console.error("[SYSTEM_ERROR] Failed to initialize:", error);
            document.getElementById('db-status').textContent = '[OFFLINE]';
            document.getElementById('db-status').className = 'text-red-400';
            tasks = [];
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
                case 'inprogress':
                    inprogressContainer.appendChild(taskElement);
                    break;
                case 'done':
                    doneContainer.appendChild(taskElement);
                    break;
                case 'todo':
                default:
                    todoContainer.appendChild(taskElement);
                    break;
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
            assigneeInfo.className = 'mt-3 flex items-center';
            
            const assigneeName = document.createElement('span');
            assigneeName.className = 'text-xs text-cyan-400';
            assigneeName.textContent = `AGENT_${task.assignee.toUpperCase()}`;
            
            assigneeInfo.appendChild(assigneeName);
            div.appendChild(assigneeInfo);
        }
        
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        return div;
    }

   // NEW SUBMIT LISTENER
document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const assigneeSelect = document.getElementById('assignee-select');
    const taskText = input.value.trim();
    const assignee = assigneeSelect.value;

    if (taskText && socket && socket.connected) {
        const taskData = { text: taskText, assignee: assignee };
        // Just send the data to the server; the UI update will come from the 'task:created' event
        socket.emit('task:create', taskData);
        input.value = ''; // Clear the input field
        socket.emit('typing:stop'); // Stop the typing indicator
    } else if (!socket.connected) {
        addActivity("ERROR: Connection lost. Cannot create task.");
    }
});
    
    // Typing indicators
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
    
    document.getElementById('task-input').addEventListener('blur', () => {
        if (isTyping && socket && socket.connected) {
            isTyping = false;
            socket.emit('typing:stop');
        }
    });

    async function deleteTask(taskId) {
        const success = await deleteTaskFromAPI(taskId);
        if (success) {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
        }
    }
    
    let draggedItemId = null;

    function handleDragStart(e) {
        draggedItemId = e.target.dataset.id;
        e.target.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        
        // Notify others that we're dragging
        if (socket && socket.connected) {
            socket.emit('task:drag:start', { taskId: draggedItemId });
        }
    }

    function handleDragEnd(e) {
        e.target.style.opacity = '1';
        
        // Notify others we stopped dragging
        if (socket && socket.connected) {
            socket.emit('task:drag:end', { taskId: draggedItemId });
        }
        
        draggedItemId = null;
    }

    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });
        column.addEventListener('dragleave', (e) => {
            column.classList.remove('drag-over');
        });
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');

            if (!draggedItemId) return;

            const newStatus = column.id;
            const success = await updateTaskInAPI(draggedItemId, newStatus);
            
            if(success) {
               const task = tasks.find(t => t.id === draggedItemId);
               if (task) {
                   task.status = newStatus;
                   renderTasks();
                   if (newStatus === 'done') {
                       triggerGlitchConfetti();
                   }
               }
            }
        });
    });
    
    // Cyber confetti with glitch effects
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];

    function triggerGlitchConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        confettiParticles = [];
        
        // Create digital particles
        for (let i = 0; i < 100; i++) {
            confettiParticles.push(createDigitalParticle());
        }
        
        // Screen flash effect
        document.body.style.animation = 'flicker 0.5s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
        
        animateDigitalConfetti();
    }

    function createDigitalParticle() {
        const x = Math.random() * confettiCanvas.width;
        const y = Math.random() * confettiCanvas.height - confettiCanvas.height;
        const size = Math.random() * 15 + 5;
        const speed = Math.random() * 5 + 2;
        const angle = Math.random() * 360;
        const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const type = Math.random() > 0.5 ? 'square' : 'line';
        return { x, y, size, speed, angle, color, type };
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

            if (p.y > confettiCanvas.height) {
                confettiParticles.splice(index, 1);
            }
        });

        if (confettiParticles.length > 0) {
            requestAnimationFrame(animateDigitalConfetti);
        } else {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });

    initializeApp();
});