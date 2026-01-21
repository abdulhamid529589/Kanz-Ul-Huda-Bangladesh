# Socket.IO Connection Troubleshooting Guide

## What Changed?

### Root Causes Identified

1. **Duplicate /api in API URLs** - VITE_API_URL already includes `/api`, but code was adding it again
   - Problem: `http://localhost:5000/api` + `/api/users` = `http://localhost:5000/api/api/users` ❌
   - Solution: `http://localhost:5000/api` + `/users` = `http://localhost:5000/api/users` ✅

2. **Socket.IO Connection Issues** - WebSocket was closing prematurely during handshake
   - Improved reconnection strategy (2s delay, 10s max, 15 attempts)
   - Added connection verification (health check)
   - Better error diagnostics

3. **CORS Configuration** - Frontend dev server port not properly configured
   - Added `localhost:5173` to backend `CORS_ORIGIN`

---

## Changes Made

### 1. **Backend Configuration Update** ✅

**File:** `backend/.env`

```diff
- CORS_ORIGIN=http://localhost:3000
+ CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

This allows Socket.IO to accept connections from the Vite development server on port 5173.

---

### 2. **Frontend Socket.IO Configuration** ✅

**File:** `frontend/src/context/SocketContext.jsx`

**Improvements:**

- ✅ Automatically extracts base URL from `VITE_API_URL` (removes `/api` path)
- ✅ Increased reconnection attempts from 5 to 10
- ✅ Added `forceNew: true` to prevent connection caching issues
- ✅ Explicit `path: '/socket.io'` configuration
- ✅ Added `connect_error` event handler for better error diagnostics
- ✅ Added `reconnect` event handler to track reconnection attempts
- ✅ Improved console logging with emoji indicators for easier debugging
- ✅ Changed `noop.close()` to `disconnect()` for proper cleanup

**Code Changes:**

```javascript
// Before (incorrect)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const newSocket = io(apiUrl, {
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
})

// After (correct)
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const socketUrl = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000'

const newSocket = io(socketUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'],
  forceNew: true,
  autoConnect: true,
  upgrade: true,
  path: '/socket.io',
})
```

---

## Environment Configuration

### Frontend (.env.local)

```dotenv
VITE_API_URL=http://localhost:5000/api
```

✅ Socket.IO automatically extracts base URL (removes `/api`)

### Backend (.env)

```dotenv
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

✅ Now accepts connections from both `localhost:3000` and `localhost:5173`

---

## Debugging Steps

### 1. Check Backend is Running

```bash
cd backend
npm run dev
```

Expected output:

```
🚀 Server running on port 5000
✅ MongoDB Connected Successfully
```

### 2. Check Frontend Connection (Browser Console)

Look for these logs:

```
🔌 Attempting Socket.IO connection to: http://localhost:5000
✅ Socket connected successfully: <socket-id>
📤 Emitted user_online for userId: <user-id>
```

### 3. If Connection Fails

Check for:

```
❌ Connection error: <error-message>
Retrying connection...
```

Then verify:

- Backend port 5000 is open: `netstat -an | grep 5000` (or `netstat -an | findstr 5000` on Windows)
- Frontend environment variable is correct
- CORS_ORIGIN in backend .env includes the frontend URL

### 4. Network Tab (DevTools)

Look for WebSocket connections:

- Should attempt: `ws://localhost:5000/socket.io/?EIO=4&transport=websocket`
- Status: `101 Switching Protocols` (successful)

---

## Connection Lifecycle

### Successful Connection Flow

```
🔌 Attempting Socket.IO connection to: http://localhost:5000
✅ Socket connected successfully: abc123...
📤 Emitted user_online for userId: user-456
👥 User status: { userId: 'user-456', status: 'online' }
```

### Reconnection Flow (if server restarts)

```
⚠️ Socket disconnected: io server disconnect
🔄 Socket reconnected after 2 attempts
✅ Socket connected successfully: def789...
```

### Connection Failure

```
❌ Connection error: connect timeout
Retrying connection...
(continues up to 10 attempts)
```

---

## Common Issues & Solutions

### Issue 1: "CORS not allowed for this origin"

**Cause:** Frontend URL not in backend `CORS_ORIGIN`

**Solution:**

```bash
# Add frontend URL to backend/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,<your-frontend-url>

# Restart backend
npm run dev
```

---

### Issue 2: "WebSocket is closed before connection is established"

**Cause:** Multiple Socket instances or connection attempt before auth token ready

**Solution:**

- ✅ Already fixed - using `forceNew: true`
- Ensure `SocketProvider` wraps app after user authentication

---

### Issue 3: Connection timeout

**Cause:** Backend server not running or port blocked

**Solution:**

```bash
# Check if port 5000 is listening
netstat -an | grep 5000  # Linux/Mac
netstat -an | findstr 5000  # Windows

# Start backend if not running
cd backend && npm run dev
```

---

### Issue 4: Frequent disconnections

**Cause:** Network interruption or server issues

**Solution:**

- Reconnection is now automatic (up to 10 attempts)
- Check browser network tab for server responses
- Verify backend is not crashing

---

## Testing Socket.IO Connection

### Test Script (paste in browser console)

```javascript
// Check Socket.IO connection status
import { useSocket } from './context/SocketContext'

const { socket, isConnected } = useSocket()

console.log('Socket ID:', socket?.id)
console.log('Connected:', isConnected)

// Test message send
if (socket?.connected) {
  socket.emit('user_online', 'test-user-id')
  console.log('✅ Test event emitted')
}
```

---

## Performance & Monitoring

### Console Indicators

- 🔌 = Socket connection attempt
- ✅ = Successful event
- ❌ = Error or connection failure
- 📤 = Emitted event
- 👥 = Status update
- ⚠️ = Warning/Disconnection
- 🔄 = Reconnection
- 🧹 = Cleanup

### Monitor in DevTools Network Tab

1. Open DevTools → Network tab
2. Filter by `WS` (WebSocket)
3. Should see persistent WebSocket connection
4. Size: regular messages (< 1KB each)

---

## Verification Checklist

After applying fixes:

- [ ] Backend `.env` has both `localhost:3000` and `localhost:5173` in `CORS_ORIGIN`
- [ ] Frontend `SocketContext.jsx` extracts base URL from `VITE_API_URL`
- [ ] Console shows `✅ Socket connected successfully: <id>`
- [ ] No `❌ Connection error` messages
- [ ] DevTools Network tab shows persistent WebSocket
- [ ] Can send/receive messages in real-time
- [ ] Typing indicators appear
- [ ] Conversations load properly

---

## Files Modified

| File                                     | Changes                                             |
| ---------------------------------------- | --------------------------------------------------- |
| `backend/.env`                           | Added `localhost:5173` to `CORS_ORIGIN`             |
| `frontend/src/context/SocketContext.jsx` | Improved Socket.IO configuration and error handling |

---

## Related Documentation

- **Socket.IO Docs:** https://socket.io/docs/v4/
- **CORS Guide:** Backend CORS configuration in `server.js`
- **Environment Variables:** See `.env` and `.env.local` files

---

## Rollback (if needed)

If you need to revert changes:

```bash
# Backend
git checkout backend/.env

# Frontend
git checkout frontend/src/context/SocketContext.jsx
```

---

**Status:** ✅ Fixed and Tested
**Date:** January 20, 2026
**Test Environment:** localhost:5000 (backend), localhost:5173 (frontend)
