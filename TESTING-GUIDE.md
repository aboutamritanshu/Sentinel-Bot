#  Testing Guide for Sentinel AI Bot

##  Quick Start Testing

### 1. Start the Bot Directly
```bash
# Navigate to bot directory
cd "D:\Sentinel Bot"

# Start without building (for testing)
npm start
```

### 2. Frontend Dashboard
```bash
# In another terminal
cd "D:\Sentinel Bot\frontend"
npm run dev
```

##  Testing Methods

###  Method 1: Direct Bot Testing
1. **Start the bot**: `npm start`
2. **Invite to Discord**: Use bot invite link
3. **Test commands**: `/report`, `/ticket`, `/utility`

###  Method 2: Frontend Dashboard
1. **Start frontend**: `cd frontend && npm run dev`
2. **Open dashboard**: http://localhost:3000
3. **Test features**: Health checks, stats, monitoring

###  Method 3: API Testing
1. **Start backend**: `npm start`
2. **Test endpoints**: 
   - `GET http://localhost:3000/health`
   - `GET http://localhost:3000/api/admin/stats/guild-id`

###  Method 4: Unit Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:performance
npm run test:security
```

##  What to Test

###  Bot Commands
- `/report` - Report a user
- `/ticket` - Create support ticket
- `/utility serverinfo` - Server information
- `/utility ping` - Bot latency
- `/utility uptime` - Bot uptime

###  Frontend Features
- Dashboard loading
- Statistics display
- Health monitoring
- Responsive design

###  API Endpoints
- Health checks
- Admin routes
- Data retrieval

##  Troubleshooting

###  Build Errors
- Ignore TypeScript errors for testing
- Use `npm start` instead of `npm run build && npm start`

###  Database Issues
- Ensure PostgreSQL is running
- Check connection string in .env

###  Discord Issues
- Verify bot token
- Check bot permissions
- Ensure bot is in server

##  Quick Test Commands

```bash
# Test 1: Start bot
npm start

# Test 2: Check health
curl http://localhost:3000/health

# Test 3: Start frontend
cd frontend && npm run dev

# Test 4: Run tests
npm test
```

##  Expected Results

###  Bot Should
- Connect to Discord
- Respond to slash commands
- Log messages
- Show online status

###  Frontend Should
- Load beautiful dashboard
- Display statistics
- Show health status
- Be interactive

###  API Should
- Return health status
- Serve admin endpoints
- Handle requests properly
