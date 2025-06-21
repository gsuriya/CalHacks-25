"use client"
import { useState } from "react"
import { X, Heart, Shirt, Filter } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"

interface Outfit {
  id: number
  image: string
  items: string[]
  tags: string[]
  price: number
  occasion: string
  vibe: string
}

const outfits: Outfit[] = [
  {
    id: 1,
    image: "/placeholder.svg?height=600&width=400",
    items: ["Zara Oversized Blazer", "H&M High-Waist Jeans", "Nike Air Force 1"],
    tags: ["Casual", "Autumn", "Cotton"],
    price: 189,
    occasion: "Casual",
    vibe: "Minimalist",
  },
  {
    id: 2,
    image: "/placeholder.svg?height=600&width=400",
    items: ["ASOS Midi Dress", "Zara Heeled Boots", "Vintage Leather Jacket"],
    tags: ["Party", "Evening", "Polyester"],
    price: 245,
    occasion: "Party",
    vibe: "Bold",
  },
  {
    id: 3,
    image: "/placeholder.svg?height=600&width=400",
    items: ["Mango Blazer Set", "COS White Shirt", "Everlane Loafers"],
    tags: ["Work", "Professional", "Wool"],
    price: 320,
    occasion: "Work",
    vibe: "Professional",
  },
]

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < outfits.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const currentOutfit = outfits[currentIndex]

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10 p-4">
        <h1 className="text-2xl font-bold gradient-text text-center mb-6">Discover Your Style</h1>

        {/* Outfit Card */}
        <div className="relative">
          <div className="glass-card rounded-3xl overflow-hidden mb-6 transform transition-all duration-300 hover:scale-105">
            <div className="relative">
              <img src={currentOutfit.image || "/placeholder.svg"} alt="Outfit" className="w-full h-96 object-cover" />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white font-semibold">${currentOutfit.price}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {currentOutfit.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-sm border border-purple-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                {currentOutfit.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-4 text-sm text-gray-400">
                <span>👗 {currentOutfit.occasion}</span>
                <span>✨ {currentOutfit.vibe}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleSwipe("left")}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center animate-pulse-glow"
            aria-label="Pass"
          >
            <X className="text-white" size={24} />
          </button>

          <button
            onClick={() => handleSwipe("right")}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center animate-pulse-glow"
            aria-label="Like"
          >
            <Heart className="text-white" size={24} />
          </button>

          <button
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center animate-pulse-glow"
            aria-label="Try on"
          >
            <Shirt className="text-white" size={24} />
          </button>

          <button
            onClick={() => setShowFilters(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center animate-pulse-glow"
            aria-label="Filters"
          >
            <Filter className="text-white" size={24} />
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full glass-card rounded-t-3xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold gradient-text">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Stores */}
              <div>
                <h3 className="font-semibold mb-3">Stores</h3>
                <div className="flex flex-wrap gap-2">
                  {["Zara", "H&M", "ASOS", "Mango", "COS"].map((store) => (
                    <button
                      key={store}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/2"></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>

              {/* Occasions */}
              <div>
                <h3 className="font-semibold mb-3">Occasion</h3>
                <div className="flex flex-wrap gap-2">
                  {["Work", "Party", "Casual", "Travel", "Date"].map((occasion) => (
                    <button
                      key={occasion}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold mt-6 animate-pulse-glow">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
