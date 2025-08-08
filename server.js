// server.js - Simple Express + SQLite backend for DLuxe Task Tracker
// Deploy directly to DigitalOcean App Platform

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

// Track connected users
const connectedUsers = new Map();
const typingUsers = new Set();

// Socket.IO real-time events
io.on('connection', (socket) => {
  console.log('[SOCKET] New agent connected:', socket.id);
  
  // User joins with their name
  socket.on('user:join', (data) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      name: data.name,
      status: 'online',
      joinedAt: new Date()
    });
    
    // Broadcast updated user list
    io.emit('users:update', Array.from(connectedUsers.values()));
    
    // Notify others
    socket.broadcast.emit('notification', {
      type: 'user_joined',
      message: `${data.name} connected to the matrix`,
      timestamp: new Date()
    });
    
    console.log(`[SOCKET] ${data.name} joined the war room`);
  });
  
  // Task created
  socket.on('task:create', (data) => {
    const user = connectedUsers.get(socket.id);

    // --- VALIDATION: Ensure incoming data is valid before processing ---
    if (!data || typeof data.text !== 'string' || data.text.trim() === '' || typeof data.assignee !== 'string') {
        console.error('[SOCKET_ERROR] Invalid task creation data received:', data);
        // Optionally emit an error back to the specific user
        socket.emit('operation_failed', { message: 'Invalid task data.' });
        return;
    }

    const task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: data.text.trim(),
        status: 'todo',
        assignee: data.assignee,
        createdBy: user?.name || 'Unknown'
    };

    db.run(
        "INSERT INTO tasks (id, text, status, assignee) VALUES (?, ?, ?, ?)",
        [task.id, task.text, task.status, task.assignee],
        (err) => {
            if (err) {
                // --- ERROR LOGGING: Log the specific database error ---
                console.error('[DB_ERROR] Failed to insert new task:', err.message);
                return;
            }
            
            console.log(`[DB_SUCCESS] Task created by ${user?.name || 'unknown'}. Broadcasting...`);

            // On success, broadcast the new task to ALL clients
            io.emit('task:created', {
                task: task,
                user: user?.name,
                timestamp: new Date()
            });
            
            // Also broadcast a generic activity update
            io.emit('activity', {
                type: 'task_created',
                message: `⚡ ${user?.name || 'Agent'} created task: "${task.text}"`,
                timestamp: new Date()
            });
        }
    );
  });
  
  // Task moved
  socket.on('task:move', (data) => {
    const user = connectedUsers.get(socket.id);
    
    db.run(
      "UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [data.status, data.taskId],
      (err) => {
        if (err) {
            console.error('[DB_ERROR] Failed to update task:', err.message);
            return;
        }
        
        // Broadcast to all clients
        io.emit('task:moved', {
            taskId: data.taskId,
            newStatus: data.status,
            movedBy: user?.name,
            timestamp: new Date()
        });
        
        // Activity log
        io.emit('activity', {
            type: 'task_moved',
            message: `[ ${user?.name} moved task to ${data.status.toUpperCase()} ]`,
            timestamp: new Date()
        });
        
        // Celebration if moved to done
        if (data.status === 'done') {
            io.emit('celebration', {
                user: user?.name,
                taskId: data.taskId
            });
        }
      }
    );
  });
  
  // Task deleted
  socket.on('task:delete', (data) => {
    const user = connectedUsers.get(socket.id);
    
    db.run("DELETE FROM tasks WHERE id = ?", [data.taskId], (err) => {
      if (err) {
          console.error('[DB_ERROR] Failed to delete task:', err.message);
          return;
      }
      io.emit('task:deleted', {
          taskId: data.taskId,
          deletedBy: user?.name,
          timestamp: new Date()
      });
      
      io.emit('activity', {
          type: 'task_deleted',
          message: `TARGET PURGED by ${user?.name}`,
          timestamp: new Date()
      });
    });
  });
  
  // Typing indicators
  socket.on('typing:start', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.add(user.name);
      socket.broadcast.emit('typing:update', Array.from(typingUsers));
    }
  });
  
  socket.on('typing:stop', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.delete(user.name);
      socket.broadcast.emit('typing:update', Array.from(typingUsers));
    }
  });
  
  // User dragging task
  socket.on('task:drag:start', (data) => {
    const user = connectedUsers.get(socket.id);
    socket.broadcast.emit('task:drag:other', {
      taskId: data.taskId,
      user: user?.name
    });
  });
  
  socket.on('task:drag:end', (data) => {
    socket.broadcast.emit('task:drag:other:end', {
      taskId: data.taskId
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      typingUsers.delete(user.name);
      
      io.emit('users:update', Array.from(connectedUsers.values()));
      socket.broadcast.emit('notification', {
        type: 'user_left',
        message: `${user.name} disconnected from the matrix`,
        timestamp: new Date()
      });
      
      console.log(`[SOCKET] ${user.name} left the war room`);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML and other assets from public folder

// Database setup
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/workspace/data/tasks.db'  // Persistent storage in DO Apps
  : './tasks.db';                // Local development

// Ensure data directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB_ERROR] Database connection failed:', err);
  } else {
    console.log(`[DB_SUCCESS] Connected to SQLite database at ${dbPath}`);
    initDatabase();
  }
});

// Initialize database schema
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('todo', 'inprogress', 'done')),
      assignee TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('[DB_ERROR] Failed to create table:', err);
    } else {
      console.log('[DB_SUCCESS] Tasks table ready');
      
      // Check if we need to add demo data
      db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
        if (!err && row.count === 0) {
          console.log('[DB_INIT] Adding demo data...');
          const demoTasks = [
            { id: 'task-demo-1', text: 'Draft Q3 sales report', status: 'todo', assignee: 'Adam' },
            { id: 'task-demo-2', text: 'Follow up with conference leads', status: 'inprogress', assignee: 'Nick' },
            { id: 'task-demo-3', text: 'Onboard client "Innovate Corp"', status: 'done', assignee: 'Omar' }
          ];
          
          const stmt = db.prepare("INSERT INTO tasks (id, text, status, assignee) VALUES (?, ?, ?, ?)");
          demoTasks.forEach(task => {
            stmt.run(task.id, task.text, task.status, task.assignee);
          });
          stmt.finalize();
        }
      });
    }
  });
}

// API Routes (Still needed for initial load and fallback)

// Health check - now includes connection count
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    database: 'connected',
    connections: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", (err, tasks) => {
    if (err) {
      console.error('[API_ERROR] Failed to fetch tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    } else {
      res.json(tasks);
    }
  });
});

// Serve the frontend on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`[SERVER] DLuxe Task Tracker running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] Database location: ${dbPath}`);
  console.log(`[SOCKET] WebSocket server active on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, closing database...');
  db.close((err) => {
    if (err) {
      console.error('[DB_ERROR] Error closing database:', err);
    } else {
      console.log('[DB_SUCCESS] Database closed');
    }
    process.exit(0);
  });
});
