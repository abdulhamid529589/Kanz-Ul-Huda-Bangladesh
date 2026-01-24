import { useState, useEffect } from 'react'
import { Command, X } from 'lucide-react'

/**
 * Admin Keyboard Shortcuts Hook
 * Enable keyboard shortcuts for faster admin workflows
 */
export const useAdminShortcuts = (callbacks = {}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger when not typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      // Cmd/Ctrl + B: Bulk operations
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        callbacks.onBulk?.()
      }

      // Cmd/Ctrl + K: Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        callbacks.onSearch?.()
      }

      // Cmd/Ctrl + E: Export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        callbacks.onExport?.()
      }

      // Cmd/Ctrl + N: New
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        callbacks.onNew?.()
      }

      // Cmd/Ctrl + R: Refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        callbacks.onRefresh?.()
      }

      // Cmd/Ctrl + ?: Show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        e.preventDefault()
        callbacks.onShowHelp?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}

/**
 * Admin Shortcuts Help Modal
 */
const AdminShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const shortcuts = [
    { keys: ['⌘', 'B'], label: 'Bulk Operations', description: 'Open bulk operations modal' },
    { keys: ['⌘', 'K'], label: 'Search', description: 'Focus search input' },
    { keys: ['⌘', 'E'], label: 'Export', description: 'Export current data' },
    { keys: ['⌘', 'N'], label: 'New Item', description: 'Create new item' },
    { keys: ['⌘', 'R'], label: 'Refresh', description: 'Refresh current view' },
    { keys: ['⌘', '?'], label: 'Help', description: 'Show this shortcuts menu' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Command size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-6 space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium text-sm">{shortcut.label}</p>
                <p className="text-xs text-gray-600 mt-1">{shortcut.description}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {shortcut.keys.map((key, i) => (
                  <div key={i}>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-semibold text-gray-800">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <p className="text-xs text-gray-600">
            💡 Tip: Press{' '}
            <kbd className="px-1 bg-white border border-gray-300 rounded text-xs">⌘</kbd> or{' '}
            <kbd className="px-1 bg-white border border-gray-300 rounded text-xs">Ctrl</kbd> +
            letter to trigger shortcuts
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminShortcutsHelp
