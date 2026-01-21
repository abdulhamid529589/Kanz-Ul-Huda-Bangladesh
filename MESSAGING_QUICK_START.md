# Messaging System - Quick Reference

## 🎯 Quick Start (5 Minutes)

### 1. Install Dependencies (Already Done ✓)

```bash
# Backend
npm install socket.io

# Frontend
npm install socket.io-client
```

### 2. Start Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 4. Use Messaging

1. Log in to your account
2. Click **"Messages"** in sidebar
3. Click **"+"** to create a group
4. Select members and send

---

## 🎮 What You Can Do

### Create Groups

- Click the **+** button
- Name your group
- Add multiple members
- Messages sync in real-time

### Send Messages

- Type your message
- Press Enter or click Send
- Message appears instantly

### Edit/Delete

- Hover over your message
- Click **⋮** menu
- Choose Edit or Delete

### See Who's Typing

- When someone types, you'll see "User is typing..."
- Disappears after they stop

### Track Read Status

- Unread messages show badge
- See who read your message

---

## 📂 Key Files

**Backend:**

- `backend/models/Message.js` - Message database schema
- `backend/models/Conversation.js` - Group schema
- `backend/routes/messagingRoutes.js` - API endpoints
- `backend/utils/socketHandler.js` - Real-time events
- `backend/server.js` - Main server (modified)

**Frontend:**

- `frontend/src/context/SocketContext.jsx` - Socket setup
- `frontend/src/components/ChatWindow.jsx` - Chat UI
- `frontend/src/components/ConversationsList.jsx` - Sidebar
- `frontend/src/components/CreateGroupModal.jsx` - Create group
- `frontend/src/pages/MessagingPage.jsx` - Main page
- `frontend/src/App.jsx` - App wrapper (modified)

---

## 🔗 API Endpoints

```
Create Group
POST /api/messaging/conversations

Get Conversations
GET /api/messaging/conversations

Get Messages
GET /api/messaging/conversations/:conversationId

Send Message
POST /api/messaging/messages

Edit Message
PATCH /api/messaging/messages/:messageId

Delete Message
DELETE /api/messaging/messages/:messageId

Mark as Read
PATCH /api/messaging/messages/:messageId/read

Add Member
POST /api/messaging/conversations/:conversationId/add-participant

Remove Member
POST /api/messaging/conversations/:conversationId/remove-participant

Leave Group
POST /api/messaging/conversations/:conversationId/leave
```

---

## 🎨 Features List

| Feature                    | Status |
| -------------------------- | ------ |
| Real-time messaging        | ✅     |
| Group creation             | ✅     |
| Typing indicators          | ✅     |
| Online/offline status      | ✅     |
| Edit messages              | ✅     |
| Delete messages            | ✅     |
| Read receipts              | ✅     |
| Message history            | ✅     |
| Add/remove members         | ✅     |
| Search conversations       | ✅     |
| Filter (all/groups/unread) | ✅     |
| Mobile responsive          | ✅     |
| Dark mode support          | ✅     |

---

## 🔍 Debugging

### Check Connection

```javascript
// In browser console
localStorage.getItem('userId') // Should show your ID
localStorage.getItem('authToken') // Should show JWT token
```

### View Socket Status

```javascript
// In browser console
// If Socket.io connected successfully, you'll see events firing
```

### Check Backend

```bash
# Backend should show:
# ✅ MongoDB Connected Successfully
# 🚀 Server running on port 5000
# 📅 Week starts on: (day)
```

---

## 💬 Example Usage

### Create Group in Code

```javascript
const createGroup = async () => {
  const response = await fetch('/api/messaging/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'My Group',
      participantIds: ['user1', 'user2'],
      description: 'Group description',
    }),
  })
  const group = await response.json()
  return group
}
```

### Send Message in Code

```javascript
const sendMessage = () => {
  socket.emit('send_message', {
    conversationId: 'conv_123',
    content: 'Hello everyone!',
    senderId: userId,
  })
}
```

### Listen for Messages in Code

```javascript
socket.on('receive_message', (message) => {
  console.log(`${message.senderInfo.name}: ${message.content}`)
  // Add to state
  setMessages((prev) => [...prev, message])
})
```

---

## ⚙️ Configuration

### Change Backend Port

Edit `backend/server.js`:

```javascript
const PORT = process.env.PORT || 5000 // Change 5000
```

### Change Frontend API URL

Edit `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Production Deployment

1. Update CORS_ORIGIN in backend .env
2. Update VITE_API_URL in frontend
3. Enable SSL/TLS
4. Use Redis adapter for multiple servers
5. Set NODE_ENV=production

---

## 📱 Mobile Testing

Works on:

- ✅ iPhone Safari
- ✅ Android Chrome
- ✅ Tablet browsers
- ✅ Desktop browsers

---

## 🚨 Common Issues

| Issue                        | Solution                                     |
| ---------------------------- | -------------------------------------------- |
| Messages not sending         | Check Socket.IO connection, verify JWT token |
| Can't create group           | Ensure at least 1 member selected            |
| Can't see new messages       | Refresh page, check Socket connection        |
| Typing indicator not showing | Normal delay - appears within 1 second       |
| Member list empty            | Load users first, ensure other users exist   |

---

## 📞 Need Help?

Check these files for details:

1. `MESSAGING_IMPLEMENTATION_COMPLETE.md` - Full documentation
2. `MESSAGING_SYSTEM_GUIDE.md` - Original guide with code examples
3. Backend logs - `npm run dev` output
4. Browser console - DevTools console tab

---

**Last Updated**: January 20, 2026
**Status**: Production Ready ✅
