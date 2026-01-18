import toast from 'react-hot-toast'

/**
 * Show success toast notification
 * @param {string} message - Success message
 */
export const showSuccess = (message) => {
  toast.success(message)
}

/**
 * Show error toast notification
 * @param {string} message - Error message
 */
export const showError = (message) => {
  toast.error(message || 'An error occurred. Please try again.')
}

/**
 * Show info toast notification
 * @param {string} message - Info message
 */
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  })
}

/**
 * Show loading toast notification
 * @param {string} message - Loading message
 * @returns {string} - Toast ID for dismissing
 */
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message)
}

/**
 * Dismiss toast by ID
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId)
}

/**
 * Show promise toast (auto handles success/error)
 * @param {Promise} promise - Promise to track
 * @param {object} messages - Messages for loading, success, error
 */
export const showPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Loading...',
    success: messages.success || 'Success!',
    error: messages.error || 'An error occurred',
  })
}

/**
 * Confirm action with toast-like confirmation
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} - True if confirmed
 */
export const confirmAction = (message) => {
  return new Promise((resolve) => {
    const toastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <span className="font-medium">{message}</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(true)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(false)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      },
    )
  })
}

export default {
  showSuccess,
  showError,
  showInfo,
  showLoading,
  dismissToast,
  showPromise,
  confirmAction,
}
