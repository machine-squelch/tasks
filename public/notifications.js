// Enterprise-grade Notifications System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.soundEnabled = true;
        this.browserNotificationsEnabled = false;
        this.init();
    }

    async init() {
        await this.requestPermissions();
        this.createNotificationContainer();
        this.setupSoundSystem();
    }

    async requestPermissions() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.browserNotificationsEnabled = permission === 'granted';
        }
    }

    createNotificationContainer() {
        // Remove existing container
        const existing = document.getElementById('notification-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 350px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    setupSoundSystem() {
        this.sounds = {
            success: this.createAudioBeep(800, 0.1),
            error: this.createAudioBeep(400, 0.2),
            info: this.createAudioBeep(600, 0.1),
            warning: this.createAudioBeep(500, 0.15)
        };
    }

    createAudioBeep(frequency, duration) {
        return () => {
            if (!this.soundEnabled) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            persistent: options.persistent || false,
            actions: options.actions || []
        };

        this.notifications.unshift(notification);
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.renderNotification(notification);
        this.playSound(type);
        
        if (this.browserNotificationsEnabled && options.browser) {
            this.showBrowserNotification(message, type);
        }

        return notification.id;
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.style.cssText = this.getNotificationStyles(notification.type);
        element.style.pointerEvents = 'auto';

        const icon = this.getTypeIcon(notification.type);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">${icon}</span>
                    <span class="notification-type">${notification.type.toUpperCase()}</span>
                    <button class="notification-close" onclick="window.notificationManager.dismiss('${notification.id}')">×</button>
                </div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-timestamp">${notification.timestamp.toLocaleTimeString()}</div>
                ${notification.actions.length > 0 ? this.renderActions(notification.actions) : ''}
            </div>
        `;

        // Add slide-in animation
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        container.appendChild(element);

        setTimeout(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        }, 10);

        // Auto-dismiss non-persistent notifications
        if (!notification.persistent) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, this.getAutoDismissTime(notification.type));
        }
    }

    getNotificationStyles(type) {
        const baseStyles = `
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            margin-bottom: 10px;
            padding: 15px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        const typeStyles = {
            success: 'border-left: 4px solid #00ff00; color: #00ff00;',
            error: 'border-left: 4px solid #ff0000; color: #ff0000;',
            warning: 'border-left: 4px solid #ffaa00; color: #ffaa00;',
            info: 'border-left: 4px solid #00ffff; color: #00ffff;'
        };

        return baseStyles + typeStyles[type];
    }

    getTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getAutoDismissTime(type) {
        const times = {
            success: 3000,
            error: 5000,
            warning: 4000,
            info: 3000
        };
        return times[type] || 3000;
    }

    renderActions(actions) {
        return `
            <div class="notification-actions" style="margin-top: 10px;">
                ${actions.map(action => `
                    <button 
                        onclick="${action.handler}" 
                        style="
                            background: rgba(0, 255, 0, 0.2);
                            border: 1px solid #00ff00;
                            color: #00ff00;
                            padding: 5px 10px;
                            margin-right: 5px;
                            border-radius: 3px;
                            font-size: 10px;
                            cursor: pointer;
                        "
                    >${action.label}</button>
                `).join('')}
            </div>
        `;
    }

    dismiss(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    showBrowserNotification(message, type) {
        if (this.browserNotificationsEnabled) {
            new Notification(`DLuxe Sales - ${type.toUpperCase()}`, {
                body: message,
                icon: '/dllogoonly.png',
                tag: 'dluxe-notification'
            });
        }
    }

    playSound(type) {
        const sound = this.sounds[type];
        if (sound) {
            try {
                sound();
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.show(
            `Notification sounds ${this.soundEnabled ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    clear() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }

    // Quick notification methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

// Initialize notification manager
window.notificationManager = new NotificationManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}