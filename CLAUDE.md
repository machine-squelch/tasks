# CLAUDE.md

## Task Management System Issues

### Current Problems:
1. **Orange outline missing** on the negotiation/closing kanban column
2. **Tasks don't persist** when dragged between columns (they snap back)
3. **Delete functionality not working** - clicking [X] does nothing

### Technical Details:
- Deployment: Digital Ocean Apps at https://protonfield.com
- Frontend: HTML/CSS/JavaScript with cyberpunk styling
- Backend: Node.js Express server with SQLite database
- Real-time: Socket.IO implementation

### Expected Behavior:
1. The "[CLOSING]" kanban column should have a **prominent orange outline/border**
2. When dragging tasks between columns, they should **stay in the new column permanently**
3. Clicking the [X] button should **immediately delete tasks from the interface and database**

### Current Status:
- Interface loads correctly with cyberpunk styling
- All kanban columns are visible (Prospecting, Active Deals, Closing, Revenue)
- Tasks can be created successfully
- Real-time sync indicators show connection status

### Deployment Commands:
```bash
# For local testing:
npm install
npm start

# For Digital Ocean Apps:
# Uses app.yaml configuration
# Auto-deploys from GitHub repo: machine-squelch/tasks
```

### Repository Structure:
```
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── socket-client.js
│   └── sales-features.js
├── server.js
├── package.json
├── app.yaml
└── .gitignore
```

### Notes:
- The application works for task creation and basic UI
- Issues appear to be related to CSS specificity and JavaScript event handling
- Database persistence and API endpoints need verification