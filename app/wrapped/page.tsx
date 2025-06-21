"use client"
import { useState } from "react"
import { ChevronDown, Share } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"

const slides = [
  {
    id: 1,
    title: "Your 2025 Style Wrapped",
    subtitle: "Let's see what you've been up to! 🎬",
    content: (
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient flex items-center justify-center">
          <span className="text-4xl">✨</span>
        </div>
        <p className="text-gray-300">Ready to discover your fashion journey?</p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Your Top 3 Brands",
    subtitle: "You've got great taste! 👑",
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-4 glass-card rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="font-bold text-lg">Zara</h3>
            <p className="text-gray-400">47 items purchased</p>
          </div>
        </div>
        <div className="flex items-center gap-4 glass-card rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="font-bold text-lg">H&M</h3>
            <p className="text-gray-400">32 items purchased</p>
          </div>
        </div>
        <div className="flex items-center gap-4 glass-card rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-yellow-600 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="font-bold text-lg">ASOS</h3>
            <p className="text-gray-400">28 items purchased</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Your Signature Color",
    subtitle: "You wore this color 73% of the time! 🎨",
    content: (
      <div className="text-center">
        <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse-glow flex items-center justify-center">
          <span className="text-white text-2xl font-bold">Purple</span>
        </div>
        <p className="text-gray-300 mb-4">Your most-worn color family</p>
        <div className="flex justify-center gap-2">
          {["#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6"].map((color, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full border-2 border-white/20"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Your Style Stats",
    subtitle: "Look at you go! 📊",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text mb-2">127</div>
          <p className="text-gray-400 text-sm">Outfits Tried</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text mb-2">89</div>
          <p className="text-gray-400 text-sm">AR Try-Ons</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text mb-2">23</div>
          <p className="text-gray-400 text-sm">Style Challenges</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text mb-2">156</div>
          <p className="text-gray-400 text-sm">Community Likes</p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Share Your Wrapped",
    subtitle: "Show off your style journey! 📱",
    content: (
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse-glow flex items-center justify-center">
          <Share className="text-white" size={48} />
        </div>
        <p className="text-gray-300 mb-6">Ready to share your 2025 Style Wrapped?</p>
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold animate-pulse-glow">
          Share to Stories
        </button>
      </div>
    ),
  },
]

export default function WrappedPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Slide Content */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">{slides[currentSlide].title}</h1>
            <p className="text-gray-300">{slides[currentSlide].subtitle}</p>
          </div>

          <div className="flex-1 flex items-center justify-center">{slides[currentSlide].content}</div>
        </div>

        {/* Navigation */}
        <div className="p-6 pb-24">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-purple-500 w-8" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentSlide > 0 && (
              <button onClick={prevSlide} className="flex-1 bg-white/10 text-white py-3 rounded-xl">
                Previous
              </button>
            )}
            {currentSlide < slides.length - 1 ? (
              <button
                onClick={nextSlide}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold animate-pulse-glow"
              >
                Next
              </button>
            ) : (
              <button className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold animate-pulse-glow">
                Done
              </button>
            )}
          </div>

          {/* Swipe Hint */}
          {currentSlide === 0 && (
            <div className="text-center mt-4">
              <ChevronDown className="text-gray-400 mx-auto animate-bounce" size={24} />
              <p className="text-gray-400 text-sm">Swipe up to continue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
