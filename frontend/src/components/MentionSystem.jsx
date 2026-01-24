import { useState, useRef, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const MentionedUsers = ({ groupId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers()
    }
  }, [groupId])

  const fetchGroupMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/groups/${groupId}/members`)
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (value.startsWith('@')) {
      const query = value.slice(1).toLowerCase()
      const filtered = members.filter(
        (m) => m.username?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query),
      )
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers([])
    }
  }

  const selectMember = (member) => {
    onSelect(member)
    setSearchTerm('')
    setFilteredMembers([])
  }

  return (
    <div className="relative">
      {filteredMembers.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="p-2 space-y-1">
            {filteredMembers.map((member) => (
              <button
                key={member._id}
                onClick={() => selectMember(member)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-slate-200 text-sm transition-colors"
              >
                <span className="font-medium">@{member.username}</span>
                <span className="text-slate-400 text-xs ml-2">{member.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const MentionManager = ({ content, mentions = [] }) => {
  const renderMentions = () => {
    let result = content
    mentions.forEach((mention) => {
      result = result.replace(
        `@${mention.username}`,
        `<span class="text-blue-400 font-medium">@${mention.username}</span>`,
      )
    })
    return result
  }

  return (
    <div className="whitespace-pre-wrap break-words">
      {mentions.length > 0 ? (
        <div dangerouslySetInnerHTML={{ __html: renderMentions() }} />
      ) : (
        <>{content}</>
      )}
    </div>
  )
}

export const MentionNotification = ({ sender, recipient }) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-blue-600/20 border border-blue-600/40 rounded-lg mb-2">
      <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-slate-200">
          <span className="font-medium">{sender}</span> mentioned you in a message
        </p>
      </div>
    </div>
  )
}
