"use client"
import { useState } from "react"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"
import AnimatedBackground from "../../components/AnimatedBackground"

export default function TryOnPage({ params }: { params: { productId: string } }) {
  const [selectedSize, setSelectedSize] = useState("M")
  const [showOverlay, setShowOverlay] = useState(false)

  const sizes = ["XS", "S", "M", "L", "XL"]

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Link href="/swipe" className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <h1 className="text-lg font-semibold gradient-text">Virtual Try-On</h1>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="relative z-10 px-6">
        <div className="aspect-[3/4] rounded-3xl overflow-hidden glass-card relative">
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-gray-300">Camera preview with outfit overlay</p>
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold"
              >
                {showOverlay ? "Hide Overlay" : "Show Overlay"}
              </button>
            </div>
          </div>

          {/* Outfit Overlay */}
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl border-2 border-dashed border-purple-400 flex items-center justify-center">
                <span className="text-purple-400 text-lg">Outfit Overlay</span>
              </div>
            </div>
          )}
        </div>

        {/* Size Selector */}
        <div className="mt-6 glass-card rounded-2xl p-4">
          <h3 className="font-semibold mb-3 text-center">Select Size</h3>
          <div className="flex justify-center gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  selectedSize === size
                    ? "border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "border-gray-600 text-gray-400 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add to Cart FAB */}
      {showOverlay && (
        <div className="fixed bottom-24 right-6 z-50">
          <button className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center animate-pulse-glow shadow-2xl">
            <ShoppingCart className="text-white" size={24} />
          </button>
        </div>
      )}
    </div>
  )
}
