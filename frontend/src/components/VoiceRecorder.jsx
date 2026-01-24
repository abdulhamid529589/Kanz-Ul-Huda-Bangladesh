import { useState, useRef, useEffect } from 'react'
import { Mic, Pause, Play, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export const VoiceRecorder = ({ onSend, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [recordingData, setRecordingData] = useState(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordingData({ blob: audioBlob, url: audioUrl })
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordedTime(0)

      timerRef.current = setInterval(() => {
        setRecordedTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      streamRef.current.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const discardRecording = () => {
    if (isRecording) {
      stopRecording()
    }
    setRecordingData(null)
    setRecordedTime(0)
    clearInterval(timerRef.current)
  }

  const sendVoiceMessage = () => {
    if (recordingData) {
      onSend(recordingData)
      discardRecording()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (recordingData) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-slate-300 text-sm font-medium mb-2">Voice Message Ready</p>
            <audio src={recordingData.url} controls className="w-full bg-slate-700 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={discardRecording}
            className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Discard
          </button>
          <button
            onClick={sendVoiceMessage}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="bg-gradient-to-r from-red-600/10 to-slate-900 border border-red-700/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-slate-300 font-medium">Recording...</span>
            <span className="text-slate-400 text-sm ml-auto">{formatTime(recordedTime)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isPaused ? (
              <>
                <Play size={16} />
                Resume
              </>
            ) : (
              <>
                <Pause size={16} />
                Pause
              </>
            )}
          </button>
          <button
            onClick={stopRecording}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Done Recording
          </button>
          <button
            onClick={discardRecording}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
      title="Click to start voice recording"
    >
      <Mic size={18} />
      Record Voice
    </button>
  )
}
