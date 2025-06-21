"use client"
import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, VolumeX, Camera, RotateCcw, Palette } from "lucide-react"
import AnimatedBackground from "./components/AnimatedBackground"
import VapiVoiceWidget from "../components/VapiVoiceWidget"
import TranscriptBox from "../components/TranscriptBox"
import { analyzeAndStoreSkinTone } from "../lib/skin-tone-storage"

export default function HomePage() {
  const [micEnabled, setMicEnabled] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [isAnalyzingSkinTone, setIsAnalyzingSkinTone] = useState(false)
  const [skinToneAnalyzed, setSkinToneAnalyzed] = useState(false)
  
  // Voice agent states
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{role: string, text: string}>>([])
  const [isVoiceConnected, setIsVoiceConnected] = useState(false)
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      setCameraError(null)
      
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Stop video element first to prevent AbortError
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready before playing
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.warn('Video play error (non-critical):', playError)
          // Don't throw error for play issues as they're often browser-specific
        }
      }
      
      setCameraEnabled(true)
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Unable to access camera. Please check permissions.')
      setCameraEnabled(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraEnabled(false)
  }

  const switchCamera = () => {
    const newFacingMode = isFrontCamera ? 'environment' : 'user'
    setIsFrontCamera(!isFrontCamera)
    startCamera(newFacingMode)
  }

  const capturePhoto = async () => {
    if (videoRef.current && cameraEnabled) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        
        // Get image data for skin tone analysis
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        // Start skin tone analysis
        setIsAnalyzingSkinTone(true)
        
        try {
          // Analyze and store skin tone
          await analyzeAndStoreSkinTone(imageDataUrl)
          setSkinToneAnalyzed(true)
          
          // Show success feedback
          setTimeout(() => setSkinToneAnalyzed(false), 3000)
          
        } catch (error) {
          console.error('Skin tone analysis failed:', error)
        } finally {
          setIsAnalyzingSkinTone(false)
        }
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `style-ai-photo-${Date.now()}.jpg`
            a.click()
            URL.revokeObjectURL(url)
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const toggleMicrophone = async () => {
    if (micEnabled) {
      // Stop microphone
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop())
        setMicStream(null)
      }
      setMicEnabled(false)
    } else {
      // Start microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        setMicStream(stream)
        setMicEnabled(true)
      } catch (error) {
        console.error('Microphone error:', error)
        alert('Unable to access microphone. Please check permissions.')
      }
    }
  }

  useEffect(() => {
    // Start camera when component mounts
    startCamera()
    
    // Cleanup on unmount
    return () => {
      stopCamera()
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Animated Background - Always present */}
      <AnimatedBackground />
      
      {/* Camera Feed - Full Screen */}
      <div className="absolute inset-0">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                <Camera size={48} className="text-white" />
              </div>
              <p className="text-gray-300 mb-4">
                {cameraError || "Camera preview will appear here"}
              </p>
              {cameraError && (
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
                >
                  Retry Camera
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Overlay for Better UI Visibility */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Voice Transcript Box - Top Left */}
      <TranscriptBox 
        transcript={voiceTranscript}
        isConnected={isVoiceConnected}
        isSpeaking={isVoiceSpeaking}
      />

      {/* Skin Tone Analysis Feedback - Top Center */}
      {(isAnalyzingSkinTone || skinToneAnalyzed) && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className={`glass-card rounded-2xl px-4 py-3 transition-all duration-300 ${
            skinToneAnalyzed ? 'bg-green-500/20 border-green-400/30' : 'bg-purple-500/20 border-purple-400/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isAnalyzingSkinTone ? 'animate-spin' : ''
              }`}>
                <Palette className={`${
                  skinToneAnalyzed ? 'text-green-400' : 'text-purple-400'
                }`} size={16} />
              </div>
              <span className={`text-sm font-medium ${
                skinToneAnalyzed ? 'text-green-300' : 'text-purple-300'
              }`}>
                {isAnalyzingSkinTone ? 'Analyzing skin tone...' : 'Skin tone updated!'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Vapi Voice Widget - No UI, just handles voice logic */}
      <VapiVoiceWidget 
        isEnabled={micEnabled}
        onTranscriptUpdate={setVoiceTranscript}
        onConnectionChange={setIsVoiceConnected}
        onSpeakingChange={setIsVoiceSpeaking}
      />

      {/* Camera Controls - Top Right */}
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={switchCamera}
          className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          aria-label="Switch camera"
        >
          <RotateCcw className="text-white" size={20} />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-20 left-0 right-0 px-6">
        <div className="glass-card rounded-3xl p-4">
          <div className="flex justify-around items-center">
            {/* Mic Toggle */}
            <button
              onClick={toggleMicrophone}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                micEnabled
                  ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse-glow"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              aria-label="Toggle microphone"
            >
              {micEnabled ? <Mic className="text-white" size={24} /> : <MicOff className="text-gray-400" size={24} />}
            </button>

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              disabled={!cameraEnabled}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                cameraEnabled 
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient animate-pulse-glow"
                  : "bg-gray-600 opacity-50"
              }`}
              aria-label="Capture photo"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Camera className="text-black" size={24} />
              </div>
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => setSpeakerEnabled(!speakerEnabled)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                speakerEnabled ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-white/10 hover:bg-white/20"
              }`}
              aria-label="Toggle speaker"
            >
              {speakerEnabled ? (
                <Volume2 className="text-white" size={24} />
              ) : (
                <VolumeX className="text-gray-400" size={24} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
