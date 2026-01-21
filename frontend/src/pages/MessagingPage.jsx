import { useState } from 'react'
import { ConversationsList } from '../components/ConversationsList'
import { ChatWindow } from '../components/ChatWindow'
import { CreateGroupModal } from '../components/CreateGroupModal'

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [conversations, setConversations] = useState([])

  const handleCreateGroup = (newGroup) => {
    setSelectedConversation(newGroup)
    setIsCreateGroupOpen(false)
  }

  const handleRefreshConversations = () => {
    // Trigger a refresh in ConversationsList
    setSelectedConversation(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Messaging System
          </h1>
          <p className="text-slate-400 mt-2">
            Connect and communicate with group members in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <ConversationsList
              onSelectConversation={setSelectedConversation}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                onClose={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="bg-slate-900 rounded-lg shadow-2xl h-full flex items-center justify-center border border-slate-800">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full border border-slate-700">
                      <svg
                        className="w-8 h-8 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">
                    No Conversation Selected
                  </h2>
                  <p className="text-slate-400 mb-6">
                    Select a conversation from the list or create a new group to get started
                  </p>
                  <button
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-lg shadow-blue-600/20"
                  >
                    Create New Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleCreateGroup}
      />
    </div>
  )
}
