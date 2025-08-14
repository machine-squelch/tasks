// Enhanced Socket.IO client with production fallbacks
class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.fallbackMode = false;
    }

    initialize() {
        this.connectSocket();
    }

    connectSocket() {
        try {
            console.log('[SOCKET] Attempting connection...');
            
            // Initialize Socket.IO with production-optimized config
            this.socket = io({
                transports: ['polling'], // Force polling for Digital Ocean Apps
                timeout: 10000,
                forceNew: true,
                upgrade: false, // Disable websocket upgrades
                rememberUpgrade: false
            });

            this.setupEventHandlers();
            
        } catch (error) {
            console.error('[SOCKET] Connection failed:', error);
            this.enableFallbackMode();
        }
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('[SOCKET] Connected successfully');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.fallbackMode = false;
            this.updateConnectionStatus(true);
            
            // Join user to Socket.IO room
            this.socket.emit('user:join', { name: window.currentUser });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SOCKET] Disconnected:', reason);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            
            if (reason === 'io server disconnect') {
                // Server disconnected - try to reconnect
                this.scheduleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SOCKET] Connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.log('[SOCKET] Max reconnection attempts reached, enabling fallback mode');
                this.enableFallbackMode();
            } else {
                this.scheduleReconnect();
            }
        });

        // Handle real-time events
        this.socket.on('task:created', (data) => {
            if (data.task) {
                window.tasks.push(data.task);
                window.renderTasks();
                this.addActivity(`${data.user} created: "${data.task.text}"`);
            }
        });

        this.socket.on('task:moved', (data) => {
            const task = window.tasks.find(t => t.id === data.taskId);
            if (task) {
                task.status = data.newStatus;
                window.renderTasks();
                this.addActivity(`${data.movedBy} moved task to ${data.newStatus.toUpperCase()}`);
            }
        });

        this.socket.on('task:deleted', (data) => {
            window.tasks = window.tasks.filter(t => t.id !== data.taskId);
            window.renderTasks();
            this.addActivity(`${data.deletedBy} deleted a task`);
        });

        this.socket.on('users:update', (users) => {
            this.updateOnlineUsers(users);
        });

        this.socket.on('activity', (data) => {
            this.addActivity(data.message);
        });

        this.socket.on('notification', (data) => {
            this.addActivity(data.message);
        });
    }

    scheduleReconnect() {
        setTimeout(() => {
            if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
                console.log(`[SOCKET] Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
                this.connectSocket();
            }
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    enableFallbackMode() {
        console.log('[SOCKET] Enabling fallback mode - operating without real-time sync');
        this.fallbackMode = true;
        this.updateConnectionStatus(false);
        this.addActivity('Real-time sync unavailable - using fallback mode');
    }

    updateConnectionStatus(isConnected) {
        const badge = document.getElementById('connection-badge');
        if (isConnected) {
            badge.textContent = '[CONNECTED]';
            badge.className = 'connection-badge';
        } else {
            badge.textContent = this.fallbackMode ? '[FALLBACK_MODE]' : '[CONNECTING...]';
            badge.className = 'connection-badge disconnected';
        }

        // Update database status
        const dbStatus = document.getElementById('db-status');
        if (dbStatus) {
            if (isConnected) {
                dbStatus.textContent = '[REAL_TIME_SYNC]';
                dbStatus.className = 'text-green-400';
            } else {
                dbStatus.textContent = this.fallbackMode ? '[OFFLINE_MODE]' : '[CONNECTING]';
                dbStatus.className = this.fallbackMode ? 'text-yellow-400' : 'text-orange-400';
            }
        }
    }

    updateOnlineUsers(users) {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-status"></div>
                <span>${user.name}${user.name === window.currentUser ? ' (YOU)' : ''}</span>
            </div>
        `).join('');
    }

    addActivity(message) {
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

    // Public API methods
    createTask(taskData) {
        if (this.isConnected) {
            this.socket.emit('task:create', taskData);
        } else {
            console.log('[SOCKET] Offline - task will be created locally');
            return false; // Indicate fallback mode
        }
        return true;
    }

    moveTask(taskId, newStatus) {
        if (this.isConnected) {
            this.socket.emit('task:move', { taskId, status: newStatus });
        } else {
            console.log('[SOCKET] Offline - task move will be handled locally');
            return false;
        }
        return true;
    }

    deleteTask(taskId) {
        if (this.isConnected) {
            this.socket.emit('task:delete', { taskId });
        } else {
            console.log('[SOCKET] Offline - task deletion will be handled locally');
            return false;
        }
        return true;
    }
}

// Initialize socket manager
window.socketManager = new SocketManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.socketManager.initialize();
    });
} else {
    window.socketManager.initialize();
}