"use client"
import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2 } from "lucide-react"

interface VoiceAgentProps {
  onMicToggle?: (enabled: boolean) => void
  isMicEnabled?: boolean
}

export default function VoiceAgent({ onMicToggle, isMicEnabled = false }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setIsProcessing(false)
      }

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript)
          handleVoiceCommand(finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setIsProcessing(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setIsProcessing(false)
      }
    }
  }, [])

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()
    setIsProcessing(true)
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      
      if (lowerCommand.includes('color') || lowerCommand.includes('tone')) {
        // Navigate to color analysis
        window.location.href = '/color-analysis'
      } else if (lowerCommand.includes('outfit') || lowerCommand.includes('clothes')) {
        // Navigate to swipe
        window.location.href = '/swipe'
      } else if (lowerCommand.includes('closet')) {
        // Navigate to closet
        window.location.href = '/closet'
      } else if (lowerCommand.includes('community')) {
        // Navigate to community
        window.location.href = '/community'
      } else if (lowerCommand.includes('trending') || lowerCommand.includes('trends')) {
        // Navigate to wrapped
        window.location.href = '/wrapped'
      }
      
      setTranscript("")
    }, 2000)
  }

  const toggleListening = () => {
    if (!isMicEnabled) {
      alert('Please enable microphone first using the bottom control bar')
      return
    }

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const startListening = () => {
    if (recognitionRef.current && isMicEnabled) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start listening:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Failed to stop listening:', error)
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="absolute top-6 left-6 z-40">
      <div className="relative">
        {/* Voice Bubble */}
        <button
          onClick={toggleListening}
          disabled={!isMicEnabled}
          className={`w-16 h-16 rounded-full glass-card flex items-center justify-center transition-all duration-300 ${
            isListening 
              ? "animate-pulse-glow bg-gradient-to-r from-purple-500 to-pink-500" 
              : isMicEnabled 
                ? "hover:scale-110" 
                : "opacity-50 cursor-not-allowed"
          }`}
          aria-label="Voice Assistant"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isListening ? (
            <MicOff className="text-white" size={24} />
          ) : (
            <Mic className={isMicEnabled ? "text-purple-400" : "text-gray-400"} size={24} />
          )}
        </button>

        {/* Voice Feedback */}
        {isListening && (
          <div className="absolute top-20 left-0 w-64 glass-card rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-white font-semibold">Listening...</span>
            </div>
            {transcript && (
              <p className="text-xs text-gray-300 italic">"{transcript}"</p>
            )}
          </div>
        )}

        {/* Processing Feedback */}
        {isProcessing && (
          <div className="absolute top-20 left-0 w-64 glass-card rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-white font-semibold">Processing...</span>
            </div>
            <p className="text-xs text-gray-300">Analyzing your request...</p>
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && !isListening && !isProcessing && (
          <div className="absolute top-20 left-0 w-64 glass-card rounded-2xl p-4 animate-fade-in">
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              aria-label="Close tooltip"
            >
              ×
            </button>
            <p className="text-sm text-gray-200 mb-2">
              <span className="gradient-text font-bold">Hi! I'm your AI stylist.</span>
            </p>
            <p className="text-xs text-gray-300">
              Try saying:
              <br />
              "Analyze my color tone"
              <br />
              "Find me party outfits"
              <br />
              "What's trending?"
            </p>
            {!isMicEnabled && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ Enable microphone first
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
