# DL/// SALES_WAR_ROOM

A cyberpunk-themed sales task tracker with real-time collaboration features.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8080`

## 📦 Dependencies

The app uses these essential libraries:
- **express** - Web server framework
- **socket.io** - Real-time bidirectional communication
- **sqlite3** - Local database for task persistence
- **cors** - Cross-origin resource sharing

## 🌐 Digital Ocean Apps Deployment

The app is optimized for Digital Ocean Apps platform:

1. **Fork/clone this repo**
2. **Connect to Digital Ocean Apps** 
3. **Set environment variables:**
   - `NODE_ENV=production`
   - `PORT=8080` (auto-set by DO Apps)

The `app.yaml` file contains the deployment configuration.

## 🎯 Features

- **Real-time collaboration** with Socket.IO fallback
- **Sales-specific task management** (prospecting → active deals → closing → revenue)
- **Cyberpunk UI** with glitch effects and CRT monitor styling
- **Mobile responsive** design
- **Local Tailwind CSS** (no CDN dependencies)
- **SQLite database** with automatic schema migration

## 🔧 Development

- `npm run dev` - Start with nodemon for auto-restart
- Database auto-creates on first run
- All static assets served from `/public`

## 📁 Key Files

- `server.js` - Express server with Socket.IO
- `public/index.html` - Main application UI
- `public/script.js` - Core application logic
- `public/socket-client.js` - Real-time communication
- `public/sales-features.js` - Sales-specific functionality
- `public/style.css` - Cyberpunk styling

---
*Built by DLW Agents - Digital Luxe Sales Division*