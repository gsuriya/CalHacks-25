"use client"
import { useEffect, useState } from "react"

export default function AnimatedBackground() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; delay: number; size: number; color: string }>>([])

  useEffect(() => {
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      size: Math.random() * 60 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
    setBubbles(newBubbles)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-gradient" />

      {/* Floating Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full opacity-20 animate-bubble"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            backgroundColor: bubble.color,
            animationDelay: `${bubble.delay}s`,
            filter: "blur(1px)",
          }}
        />
      ))}

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 animate-float blur-xl" />
      <div
        className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-30 animate-float blur-xl"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full opacity-30 animate-float blur-xl"
        style={{ animationDelay: "4s" }}
      />
    </div>
  )
}
