// Fixed server.js for production hosting
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { AuthenticationManager, authLimiter } = require('./middleware/auth');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// FIXED: Digital Ocean Apps compatible Socket.IO config
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['polling'], // Force polling only for Digital Ocean Apps
  allowEIO3: true,
  pingTimeout: 30000,
  pingInterval: 10000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  // Disable connection state recovery for hosting compatibility
  cookie: false,
  serveClient: false,
  allowUpgrades: false // Disable websocket upgrades for hosting compatibility
});  
const PORT = process.env.PORT || 8080;

// Initialize authentication manager
const auth = new AuthenticationManager();

// Track connected users and state
const connectedUsers = new Map();
const typingUsers = new Set();
const activeOperations = new Map();
const taskVersions = new Map();

// Enhanced middleware for production
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));
// Static files now served by DigitalOcean static site service
// app.use(express.static('public', {
//   maxAge: '1d',
//   etag: false
// }));

// Authentication Routes
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // For demo - in production, check against user database
    const validUsers = {
      'adam': { id: 1, username: 'adam', role: 'admin', hashedPassword: await auth.hashPassword('admin123') },
      'nick': { id: 2, username: 'nick', role: 'sales_rep', hashedPassword: await auth.hashPassword('nick123') },
      'omar': { id: 3, username: 'omar', role: 'sales_rep', hashedPassword: await auth.hashPassword('omar123') }
    };

    const user = validUsers[username.toLowerCase()];
    if (!user || !(await auth.verifyPassword(password, user.hashedPassword))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = auth.generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH_ERROR] Login failed:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

app.post('/api/auth/refresh', auth.authenticateToken.bind(auth), (req, res) => {
  try {
    const newToken = auth.generateToken(req.user);
    res.json({ token: newToken });
  } catch (error) {
    console.error('[AUTH_ERROR] Token refresh failed:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Health check FIRST (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: connectedUsers.size
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('[SOCKET] New agent connected:', socket.id);
  
  // Enhanced error handling
  socket.on('error', (error) => {
    console.error('[SOCKET_ERROR]', error);
  });
  
  socket.on('connect_error', (error) => {
    console.error('[CONNECT_ERROR]', error);
  });
  
  if (socket.recovered) {
    console.log('[RECOVERY] Client state recovered for:', socket.id);
  }
  
  socket.on('user:join', (data) => {
    try {
      if (!data || !data.name) {
        socket.emit('operation_failed', { message: 'Invalid user data.' });
        return;
      }

      connectedUsers.set(socket.id, {
        id: socket.id,
        name: data.name,
        status: 'online',
        joinedAt: new Date()
      });
      
      io.emit('users:update', Array.from(connectedUsers.values()));
      socket.broadcast.emit('notification', {
        type: 'user_joined',
        message: `${data.name} connected to the matrix`,
        timestamp: new Date()
      });
      
      console.log(`[SOCKET] ${data.name} joined the war room`);
    } catch (error) {
      console.error('[ERROR] user:join', error);
      socket.emit('operation_failed', { message: 'Join failed' });
    }
  });
  
  socket.on('task:create', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      const operationId = data.operationId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!data || typeof data.text !== 'string' || data.text.trim() === '' || 
          typeof data.assignee !== 'string' || data.assignee.trim() === '') {
          console.error('[SOCKET_ERROR] Invalid task creation data received:', data);
          socket.emit('operation_failed', { 
            message: 'Invalid task data.',
            operationId: operationId
          });
          return;
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const task = {
          id: taskId,
          text: data.text.trim(),
          status: 'todo',
          assignee: data.assignee.trim(),
          task_type: data.task_type || 'general',
          priority: data.priority || 'medium',
          deal_value: data.deal_value || 0,
          due_date: data.due_date || null,
          created_by: user?.name || 'Unknown',
          created_at: timestamp,
          updated_at: timestamp
      };

      activeOperations.set(operationId, {
        type: 'task:create',
        taskId: taskId,
        userId: socket.id,
        timestamp: timestamp
      });

      db.run(
          "INSERT INTO tasks (id, text, status, assignee, task_type, priority, deal_value, due_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [task.id, task.text, task.status, task.assignee, task.task_type, task.priority, task.deal_value, task.due_date, task.created_by, task.created_at, task.updated_at],
          (err) => {
              if (err) {
                  console.error('[DB_ERROR] Failed to insert new task:', err.message);
                  socket.emit('operation_failed', {
                    message: 'Failed to create task. Please try again.',
                    operationId: operationId
                  });
                  activeOperations.delete(operationId);
                  return;
              }
              
              console.log(`[DB_SUCCESS] Task created by ${user?.name || 'unknown'}. Broadcasting...`);
              taskVersions.set(taskId, Date.now());
              
              io.emit('task:created', {
                  task: task,
                  user: user?.name,
                  timestamp: new Date(),
                  operationId: operationId
              });
              
              io.emit('activity', {
                  type: 'task_created',
                  message: `⚡ ${user?.name || 'Agent'} created task: "${task.text}"`,
                  timestamp: new Date()
              });
              
              activeOperations.delete(operationId);
          }
      );
    } catch (error) {
      console.error('[ERROR] task:create', error);
      socket.emit('operation_failed', { message: 'Task creation failed' });
    }
  });
  
  socket.on('task:move', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      
      if (!data.taskId || !data.status) {
        socket.emit('operation_failed', { message: 'Invalid task move data.' });
        return;
      }

      const newVersion = Date.now();
      const timestamp = new Date().toISOString();
      
      db.run(
        "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?",
        [data.status, timestamp, data.taskId],
        function(err) {
          if (err) {
              console.error('[DB_ERROR] Failed to update task:', err.message);
              socket.emit('operation_failed', { message: 'Failed to move task.' });
              return;
          }
          
          if (this.changes > 0) {
              console.log(`[DB_SUCCESS] Task ${data.taskId} moved by ${user?.name}. Broadcasting...`);
              taskVersions.set(data.taskId, newVersion);
              
              io.emit('task:moved', {
                  taskId: data.taskId,
                  newStatus: data.status,
                  movedBy: user?.name,
                  timestamp: new Date(),
                  version: newVersion
              });
              
              if (data.status === 'done') {
                  io.emit('celebration', {
                      user: user?.name,
                      taskId: data.taskId
                  });
              }
          }
        }
      );
    } catch (error) {
      console.error('[ERROR] task:move', error);
      socket.emit('operation_failed', { message: 'Task move failed' });
    }
  });
  
  socket.on('task:delete', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      
      if (!data.taskId) {
        socket.emit('operation_failed', { message: 'Invalid task ID.' });
        return;
      }
      
      db.run("DELETE FROM tasks WHERE id = ?", [data.taskId], function(err) {
        if (err) {
            console.error('[DB_ERROR] Failed to delete task:', err.message);
            socket.emit('operation_failed', { message: 'Failed to delete task.' });
            return;
        }
        
        if (this.changes > 0) {
          console.log(`[DB_SUCCESS] Task ${data.taskId} deleted by ${user?.name}. Broadcasting...`);
          taskVersions.delete(data.taskId);
          
          io.emit('task:deleted', {
              taskId: data.taskId,
              deletedBy: user?.name,
              timestamp: new Date()
          });
        }
      });
    } catch (error) {
      console.error('[ERROR] task:delete', error);
      socket.emit('operation_failed', { message: 'Task delete failed' });
    }
  });
  
  // Other socket events...
  socket.on('typing:start', () => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user) {
        typingUsers.add(user.name);
        socket.broadcast.emit('typing:update', Array.from(typingUsers));
      }
    } catch (error) {
      console.error('[ERROR] typing:start', error);
    }
  });
  
  socket.on('typing:stop', () => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user) {
        typingUsers.delete(user.name);
        socket.broadcast.emit('typing:update', Array.from(typingUsers));
      }
    } catch (error) {
      console.error('[ERROR] typing:stop', error);
    }
  });
  
  socket.on('disconnect', () => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        typingUsers.delete(user.name);
        
        // Cleanup operations
        for (const [operationId, operation] of activeOperations.entries()) {
          if (operation.userId === socket.id) {
            activeOperations.delete(operationId);
          }
        }
        
        io.emit('users:update', Array.from(connectedUsers.values()));
        console.log(`[SOCKET] ${user.name} left the war room`);
      }
    } catch (error) {
      console.error('[ERROR] disconnect', error);
    }
  });
});

// Database setup
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/workspace/data/tasks.db'
  : './tasks.db';

// Ensure directory exists
if (process.env.NODE_ENV === 'production') {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

let db;
try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB_ERROR] Database connection failed:', err);
    } else {
      console.log(`[DB_SUCCESS] Connected to SQLite database at ${dbPath}`);
      initDatabase();
    }
  });
} catch (error) {
  console.error('[DB_ERROR] Failed to create database:', error);
}

function initDatabase() {
  if (!db) return;
  
  // Create enhanced tasks table with sales-specific fields
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('todo', 'inprogress', 'negotiation', 'done')),
      assignee TEXT NOT NULL,
      task_type TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      deal_value INTEGER DEFAULT 0,
      due_date TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('[DB_ERROR] Failed to create table:', err);
    } else {
      console.log('[DB_SUCCESS] Tasks table ready');
      migrateExistingTasks();
    }
  });
}

function migrateExistingTasks() {
  // Check if we need to add new columns to existing tasks
  db.all("PRAGMA table_info(tasks)", (err, columns) => {
    if (err) {
      console.error('[DB_ERROR] Failed to check table info:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const newColumns = [
      { name: 'task_type', sql: 'ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT "general"' },
      { name: 'priority', sql: 'ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT "medium"' },
      { name: 'deal_value', sql: 'ALTER TABLE tasks ADD COLUMN deal_value INTEGER DEFAULT 0' },
      { name: 'due_date', sql: 'ALTER TABLE tasks ADD COLUMN due_date TEXT' },
      { name: 'created_by', sql: 'ALTER TABLE tasks ADD COLUMN created_by TEXT' }
    ];
    
    newColumns.forEach(col => {
      if (!columnNames.includes(col.name)) {
        db.run(col.sql, (err) => {
          if (err) {
            console.error(`[DB_ERROR] Failed to add column ${col.name}:`, err);
          } else {
            console.log(`[DB_SUCCESS] Added column ${col.name}`);
          }
        });
      }
    });
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    database: db ? 'connected' : 'disconnected',
    connections: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tasks', (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", (err, tasks) => {
    if (err) {
      console.error('[API_ERROR] Failed to fetch tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    } else {
      res.json(tasks || []);
    }
  });
});

// Create new task via REST API
app.post('/api/tasks', (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  const { text, assignee, task_type = 'general', priority = 'medium', deal_value = 0, due_date, createdBy } = req.body;
  
  if (!text || !assignee) {
    return res.status(400).json({ error: 'Text and assignee are required' });
  }
  
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  const task = {
    id: taskId,
    text: text.trim(),
    status: 'todo',
    assignee: assignee.trim(),
    task_type,
    priority,
    deal_value: parseInt(deal_value) || 0,
    due_date,
    created_by: createdBy || 'API',
    created_at: timestamp,
    updated_at: timestamp
  };
  
  db.run(
    "INSERT INTO tasks (id, text, status, assignee, task_type, priority, deal_value, due_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [task.id, task.text, task.status, task.assignee, task.task_type, task.priority, task.deal_value, task.due_date, task.created_by, task.created_at, task.updated_at],
    function(err) {
      if (err) {
        console.error('[API_ERROR] Failed to create task:', err);
        res.status(500).json({ error: 'Failed to create task' });
      } else {
        res.status(201).json(task);
      }
    }
  );
});

// Update task status or other fields
app.patch('/api/tasks/:id', (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  const { id } = req.params;
  const { status, text, assignee, task_type, priority, deal_value, due_date } = req.body;
  const timestamp = new Date().toISOString();
  
  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (status) { updates.push('status = ?'); values.push(status); }
  if (text) { updates.push('text = ?'); values.push(text); }
  if (assignee) { updates.push('assignee = ?'); values.push(assignee); }
  if (task_type) { updates.push('task_type = ?'); values.push(task_type); }
  if (priority) { updates.push('priority = ?'); values.push(priority); }
  if (deal_value !== undefined) { updates.push('deal_value = ?'); values.push(parseInt(deal_value) || 0); }
  if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updates.push('updated_at = ?');
  values.push(timestamp);
  values.push(id);
  
  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('[API_ERROR] Failed to update task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  const { id } = req.params;
  
  db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('[API_ERROR] Failed to delete task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json({ success: true });
    }
  });
});

// Frontend now served by DigitalOcean static site service
// API-only routes remain active

// Start server with enhanced error handling
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] DLuxe Task Tracker running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SOCKET] WebSocket server active`);
}).on('error', (err) => {
  console.error('[SERVER_ERROR] Failed to start server:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    if (db) {
      db.close();
    }
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});