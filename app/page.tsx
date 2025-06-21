"use client"
import { useState } from "react"
import { Mic, MicOff, Volume2, VolumeX, Camera } from "lucide-react"
import AnimatedBackground from "./components/AnimatedBackground"
import VoiceAgent from "./components/VoiceAgent"

export default function HomePage() {
  const [micEnabled, setMicEnabled] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatedBackground />

      {/* Camera Preview */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
        <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
              <Camera size={48} className="text-white" />
            </div>
            <p className="text-gray-300">Camera preview will appear here</p>
          </div>
        </div>
      </div>

      {/* Voice Agent */}
      <VoiceAgent />

      {/* Bottom Control Bar */}
      <div className="absolute bottom-20 left-0 right-0 px-6">
        <div className="glass-card rounded-3xl p-4">
          <div className="flex justify-around items-center">
            {/* Mic Toggle */}
            <button
              onClick={() => setMicEnabled(!micEnabled)}
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
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient flex items-center justify-center animate-pulse-glow"
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
