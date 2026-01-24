import { useState, useRef, useEffect } from 'react'
import { SmilePlus, X } from 'lucide-react'

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🙌', '💯']

export const ReactionsPicker = ({ onReactionSelect, isOpen, onClose }) => {
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-12 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 z-50"
    >
      <div className="grid grid-cols-5 gap-2">
        {EMOJI_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onReactionSelect(emoji)
              onClose()
            }}
            className="text-2xl hover:scale-125 transition transform duration-200 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export const MessageReactions = ({ reactions, onAddReaction, userId }) => {
  const [showPicker, setShowPicker] = useState(false)

  // Group reactions by emoji
  const groupedReactions = {}
  reactions?.forEach((reaction) => {
    if (!groupedReactions[reaction.emoji]) {
      groupedReactions[reaction.emoji] = []
    }
    groupedReactions[reaction.emoji].push(reaction)
  })

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <button
          key={emoji}
          onClick={() => onAddReaction(emoji)}
          className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition ${
            reactionList.some((r) => r.userId === userId)
              ? 'bg-blue-600/40 border border-blue-500 text-blue-300'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
          }`}
          title={reactionList.map((r) => r.userId).join(', ')}
        >
          <span>{emoji}</span>
          <span className="text-xs">{reactionList.length}</span>
        </button>
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="px-2 py-1 rounded text-xs bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition flex items-center gap-1"
      >
        <SmilePlus size={14} />
      </button>
      <ReactionsPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onReactionSelect={onAddReaction}
      />
    </div>
  )
}

export default MessageReactions
