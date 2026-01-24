# 🚀 Messaging System V3 - Quick Reference

**Version:** 3.0.0
**Last Updated:** January 24, 2026

---

## 📦 New Components Summary

| Component             | Purpose                       | Location                                             |
| --------------------- | ----------------------------- | ---------------------------------------------------- |
| VoiceRecorder         | Record & send voice messages  | `/frontend/src/components/VoiceRecorder.jsx`         |
| MentionSystem         | User mention picker & display | `/frontend/src/components/MentionSystem.jsx`         |
| AdvancedMessageSearch | Search with filters           | `/frontend/src/components/AdvancedMessageSearch.jsx` |
| ConversationArchiver  | Archive/delete conversations  | `/frontend/src/components/ConversationArchiver.jsx`  |
| MessageScheduler      | Schedule messages             | `/frontend/src/components/MessageScheduler.jsx`      |

---

## 🎤 Voice Messages - Quick Start

**File:** `VoiceRecorder.jsx`

```jsx
import { VoiceRecorder } from './components/VoiceRecorder'

;<VoiceRecorder
  onSend={(voiceData) => {
    // Send voice message
    sendMessage({ voiceUrl: voiceData.url, voiceDuration: 45 })
  }}
  disabled={isSending}
/>
```

**States Tracked:**

- `isRecording` - Currently recording
- `isPaused` - Paused state
- `recordedTime` - Duration in seconds
- `recordingData` - Audio blob and URL

**Features:**

- Record up to 5 minutes
- Pause/Resume capability
- Preview before sending
- Clear/Discard option

---

## @️ Mentions - Quick Start

**File:** `MentionSystem.jsx`

```jsx
import { MentionedUsers, MentionManager, MentionNotification } from './components/MentionSystem'

// Trigger mention picker
<MentionedUsers
  groupId={conversationId}
  onSelect={(member) => insertMention(member)}
/>

// Display mentions in message
<MentionManager
  content={messageContent}
  mentions={messageMentions}
/>

// Show mention notification
<MentionNotification
  sender="John"
  recipient="You"
/>
```

**How It Works:**

1. User types `@` in input
2. Dropdown shows group members
3. Click or search to select member
4. Text replaced with `@username`
5. Message contains mention reference

**API Fields:**

```javascript
mentions: [
  {
    userId: '...',
    username: 'john_doe',
    notified: false,
  },
]
```

---

## 🔍 Search - Quick Start

**File:** `AdvancedMessageSearch.jsx`

```jsx
import { AdvancedMessageSearch } from './components/AdvancedMessageSearch'

;<AdvancedMessageSearch
  conversationId={selectedConversation._id}
  isOpen={showSearch}
  onClose={() => setShowSearch(false)}
  onSelectMessage={(msg) => jumpToMessage(msg)}
/>
```

**Filters Available:**

```javascript
{
  q: "search term",           // Text search
  from: "username",           // Filter by sender
  startDate: "2026-01-20",    // From date
  endDate: "2026-01-25",      // To date
  hasMedia: true,             // Has images/files
  hasReactions: true          // Has emoji reactions
}
```

**API Endpoint:**

```
GET /api/messages/search?conversationId=...&q=...
POST /api/messages/search (with filters)
```

---

## 📦 Archive - Quick Start

**File:** `ConversationArchiver.jsx`

```jsx
import { ConversationArchiver, ArchivedConversationsList } from './components/ConversationArchiver'

// Archive controls
<ConversationArchiver
  conversation={selectedConversation}
  onArchive={(id) => removeFromList(id)}
  onUnarchive={(id) => addToList(id)}
  onDelete={(id) => completelyRemove(id)}
/>

// View archived conversations
<ArchivedConversationsList
  isOpen={showArchived}
  onClose={() => setShowArchived(false)}
  onRestore={(id) => unarchiveConversation(id)}
/>
```

**API Endpoints:**

```javascript
PATCH /api/conversations/:id/archive     // Archive/Unarchive
GET /api/conversations?archived=true     // Get archived
DELETE /api/conversations/:id            // Delete conversation
```

**Database Fields:**

```javascript
{
  isArchived: true,
  archivedAt: Date,
  archivedBy: ObjectId
}
```

---

## ⏰ Scheduling - Quick Start

**File:** `MessageScheduler.jsx`

```jsx
import { MessageScheduler, ScheduledMessagesList } from './components/MessageScheduler'

// Schedule dialog
<MessageScheduler
  conversationId={selectedConversation._id}
  onSchedule={(msg) => toast.success('Scheduled')}
  onClose={() => setShowScheduler(false)}
/>

// View scheduled messages
<ScheduledMessagesList
  conversationId={selectedConversation._id}
/>
```

**Schedule Dialog Fields:**

- Message content (1000 char limit)
- Date picker (future only)
- Time picker (HH:MM format)
- Preview of scheduled time
- Cancel button

**API Endpoints:**

```javascript
POST /api/messages/schedule              // Create scheduled
GET /api/messages/scheduled              // List scheduled
DELETE /api/messages/:id/scheduled       // Cancel scheduled
POST /api/messages/process-scheduled     // Run job
```

**Database Fields:**

```javascript
{
  isScheduled: true,
  scheduledFor: Date,
  isScheduledSent: false
}
```

---

## 📊 Integration Examples

### Integrate All V3 Features in ChatWindow

```jsx
const ChatWindow = ({ conversation }) => {
  const [showSearch, setShowSearch] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [mentions, setMentions] = useState([])

  const handleAddMention = (member) => {
    setMessageContent(messageContent + `@${member.username} `)
    setMentions([...mentions, member])
  }

  const handleSendVoice = async (voiceData) => {
    await sendMessage({
      content: '[Voice Message]',
      voiceUrl: voiceData.url,
      voiceDuration: voiceData.duration,
      mentions,
    })
  }

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="flex gap-2">
        <button onClick={() => setShowSearch(true)}>
          <Search /> Search
        </button>
        <button onClick={() => setShowScheduler(true)}>
          <Clock /> Schedule
        </button>
        <ConversationArchiver conversation={conversation} />
      </div>

      {/* Messages Display */}
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg._id}>
            {msg.voiceUrl && <audio src={msg.voiceUrl} controls />}
            {msg.mentions && msg.mentions.length > 0 && (
              <MentionNotification sender={msg.senderName} recipient="You" />
            )}
            <MentionManager content={msg.content} mentions={msg.mentions} />
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <MentionedUsers groupId={conversation._id} onSelect={handleAddMention} />
        <textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type @ to mention, or use voice..."
        />
        <div className="flex gap-2">
          <VoiceRecorder onSend={handleSendVoice} />
          <button onClick={() => setShowScheduler(true)}>Schedule</button>
          <button onClick={() => sendMessage({ content: messageContent, mentions })}>Send</button>
        </div>
      </div>

      {/* Modals */}
      <AdvancedMessageSearch
        conversationId={conversation._id}
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectMessage={jumpToMessage}
      />
      <MessageScheduler conversationId={conversation._id} onClose={() => setShowScheduler(false)} />
    </div>
  )
}
```

---

## 📋 Database Schema Reference

### Message Model

```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  content: String,
  mediaUrls: [String],

  // V3 NEW FIELDS
  voiceUrl: String,              // Audio file URL
  voiceDuration: Number,         // Seconds
  mentions: [{                   // Mentioned users
    userId: ObjectId,
    username: String,
    notified: Boolean
  }],
  isScheduled: Boolean,          // Is scheduled message
  scheduledFor: Date,            // When to send
  isScheduledSent: Boolean,      // Was it sent

  // Existing V2 fields
  reactions: [...],
  isPinned: Boolean,
  isForwarded: Boolean,
  editHistory: [...],
  readBy: [...],
  deletedBy: [...],

  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Model

```javascript
{
  _id: ObjectId,
  name: String,
  isGroup: Boolean,
  groupAdmin: ObjectId,
  participants: [ObjectId],

  // V3 NEW FIELDS
  isArchived: Boolean,           // Is archived
  archivedAt: Date,             // When archived
  archivedBy: ObjectId,         // Who archived

  // Existing fields
  groupImage: String,
  description: String,
  lastMessage: ObjectId,
  lastMessageAt: Date,
  unreadCounts: Map,
  mutedBy: [ObjectId],

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 Socket Events Reference

### Voice Messages

```javascript
// Frontend sends
socket.emit('voice_message', {
  conversationId: '...',
  voiceUrl: 'data:audio/webm;...',
  voiceDuration: 45,
})

// Backend broadcasts
socket.on('voice_received', (data) => {
  // { messageId, voiceUrl, senderName, timestamp }
})
```

### Mentions

```javascript
// Frontend sends
socket.emit('user_mentioned', {
  conversationId: '...',
  messageId: '...',
  mentionedUserId: '...',
})

// Backend broadcasts
socket.on('mention_notification', (data) => {
  // { conversationName, senderName, messagePreview }
})
```

### Scheduled Messages

```javascript
// Backend processes
socket.emit('scheduled_message_sent', {
  conversationId: '...',
  messageId: '...',
  scheduledMessage: {...}
})

socket.on('scheduled_message_sent', (data) => {
  // Message received in real-time
})
```

---

## 🎯 Performance Tips

1. **Voice Messages:** Limit to 5 minutes per message
2. **Mentions:** Cache member list to avoid repeated queries
3. **Search:** Use date range filters to reduce result set
4. **Archive:** Run monthly cleanup of deleted conversations
5. **Scheduling:** Process scheduled messages every minute

---

## 🐛 Common Issues

| Issue                        | Solution                                       |
| ---------------------------- | ---------------------------------------------- |
| Mention dropdown not showing | Ensure @ is typed, check if members exist      |
| Voice recording empty        | Check browser permissions, microphone access   |
| Search returns no results    | Try different keywords, check date filters     |
| Schedule button disabled     | Verify all fields filled, future date selected |
| Archive not appearing        | Refresh page, check permissions                |

---

## 📚 Full Documentation

For detailed documentation, see:

- `MESSAGING_FEATURES_V3.md` - Complete feature guide
- `MESSAGING_V3_EXAMPLES.md` - Code examples
- `MESSAGING_IMPLEMENTATION_GUIDE.md` - Setup guide

---

**Quick Links:**

- [Voice Messages](#-voice-messages---quick-start)
- [Mentions](#-mentions---quick-start)
- [Search](#-search---quick-start)
- [Archive](#-archive---quick-start)
- [Scheduling](#-scheduling---quick-start)
