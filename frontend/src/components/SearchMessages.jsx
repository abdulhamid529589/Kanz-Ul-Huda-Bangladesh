import { useState } from 'react'
import { Search, X, Loader } from 'lucide-react'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export const SearchMessages = ({ conversationId, onClose, onSelectMessage }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { socket } = useSocket()

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(
        `/api/messaging/conversations/${conversationId}/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setResults(data.messages || [])
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching:', error)
      toast.error('Error searching messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResult = (message) => {
    onSelectMessage?.(message)
    onClose()
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Search size={18} />
          Search Messages
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition flex items-center gap-2"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              No messages found for "{query}"
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-2">Found {results.length} result(s)</p>
              {results.map((message) => (
                <button
                  key={message._id}
                  onClick={() => handleSelectResult(message)}
                  className="w-full text-left p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition border border-slate-700/50 hover:border-slate-600"
                >
                  <div className="flex items-start gap-2">
                    <img
                      src={message.senderId?.profileImage || 'https://via.placeholder.com/32'}
                      alt={message.senderId?.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{message.senderId?.fullName}</p>
                      <p className="text-sm text-slate-200 truncate">{message.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(message.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchMessages
