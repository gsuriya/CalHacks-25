"use client"
import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import AnimatedBackground from "../components/AnimatedBackground"

export default function ColorAnalysisPage() {
  const [step, setStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setStep(3)
    }, 3000)
  }

  const colorPalette = ["#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F4A460", "#DAA520", "#B8860B", "#9ACD32"]

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold gradient-text text-center mb-8">Color Analysis</h1>

        {step === 1 && (
          <div className="space-y-6">
            {/* Face Alignment Guide */}
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="w-48 h-64 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-400 flex items-center justify-center">
                <div className="w-32 h-40 rounded-full border-2 border-purple-400 border-dashed flex items-center justify-center">
                  <span className="text-purple-400">👤</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Position Your Face</h2>
              <p className="text-gray-300 mb-4">Align your face within the oval guide for accurate color analysis</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Ensure good lighting</li>
                <li>• Remove makeup if possible</li>
                <li>• Look directly at camera</li>
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold animate-pulse-glow flex items-center justify-center gap-2"
            >
              Start Analysis <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full glass-card rounded-3xl p-8 hover:bg-white/20 transition-all duration-300"
            >
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin flex items-center justify-center">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <h2 className="text-xl font-semibold gradient-text">Finding your color season...</h2>
                  <p className="text-gray-300">Analyzing skin tone, hair, and eyes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="text-white" size={32} />
                  </div>
                  <h2 className="text-xl font-semibold">Ready to Analyze</h2>
                  <p className="text-gray-300">Tap to discover your color season</p>
                </div>
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Result Card */}
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center animate-pulse-glow">
                <span className="text-2xl">🍂</span>
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-2">Warm Autumn</h2>
              <p className="text-gray-300 mb-4">
                You have warm undertones with rich, earthy colors that complement your natural beauty
              </p>

              {/* Color Swatches */}
              <div className="flex justify-center gap-2 mb-4">
                {colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <button className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all duration-300">
                View Full Report
              </button>
            </div>

            {/* CTA */}
            <Link
              href="/swipe"
              className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-center animate-pulse-glow"
            >
              Start Browsing Outfits ✨
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
