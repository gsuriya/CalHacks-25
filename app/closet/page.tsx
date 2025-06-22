"use client"
import { useState, useEffect } from "react"
import { Search, Filter, Camera, Shirt, Check } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"

interface ClosetItem {
  id: string
  name: string
  type: string
  color: string
  image: string
  price: string
  description: string
}

export default function ClosetPage() {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Load closet items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('closetItems')
    if (savedItems) {
      try {
        setClosetItems(JSON.parse(savedItems))
      } catch (error) {
        console.error('Error loading closet items:', error)
        setClosetItems([])
      }
    }
  }, [])

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else if (newSet.size < 2) {
        // Limit to 2 items maximum
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const startMixAndMatch = () => {
    if (selectedItems.size === 0) return
    
    const selectedItemIds = Array.from(selectedItems)
    const queryParams = selectedItemIds.map(id => `item=${id}`).join('&')
    window.location.href = `/try-on/multi?${queryParams}`
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedItems(new Set())
  }

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text">My Closet</h1>
            <p className="text-gray-400">
              {closetItems.length} items
              {selectionMode && (
                <span className="ml-2 text-purple-400">
                  • {selectedItems.size}/2 selected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Search className="text-gray-400" size={20} />
            </button>
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Filter className="text-gray-400" size={20} />
            </button>
          </div>
        </div>

        {/* Mix & Match Section */}
        {closetItems.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-2 border-dashed border-teal-400 flex items-center justify-center">
                <Shirt className="text-teal-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Mix & Match Try-On</h3>
                <p className="text-gray-400 text-sm">
                  {selectionMode 
                    ? "Select up to 2 items to try on together"
                    : "Try on multiple garments at once"
                  }
                </p>
              </div>
            </div>
            
            {selectionMode ? (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={exitSelectionMode}
                  className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={startMixAndMatch}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedItems.size > 0
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white animate-pulse-glow'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Try On {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="w-full mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-semibold animate-pulse-glow"
              >
                Start Mix & Match
              </button>
            )}
          </div>
        )}

        {/* Add Item Section */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-400 flex items-center justify-center">
              <Camera className="text-purple-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Add New Item</h3>
              <p className="text-gray-400 text-sm">Snap a photo to add to your closet</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold animate-pulse-glow"
          >
            Add This Garment
          </button>
        </div>

        {/* Items Grid */}
        {closetItems.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Camera className="text-purple-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your Closet is Empty</h3>
            <p className="text-gray-300 mb-4">Start building your wardrobe by adding items from the swipe page!</p>
            <button
              onClick={() => window.location.href = '/swipe'}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Discover Clothes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {closetItems.map((item) => (
              <div 
                key={item.id} 
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  selectionMode ? 'cursor-pointer hover:scale-105' : ''
                } ${
                  selectedItems.has(item.id) ? 'ring-2 ring-teal-400 bg-teal-500/10' : ''
                }`}
                onClick={selectionMode ? () => toggleItemSelection(item.id) : undefined}
              >
                <div className="relative aspect-square">
                  <img 
                    src={item.image || "/placeholder.svg"} 
                    alt={item.name} 
                    className="w-full h-full object-contain bg-white/5" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                  
                  {/* Selection indicator */}
                  {selectionMode && (
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      selectedItems.has(item.id)
                        ? 'bg-teal-400 border-teal-400'
                        : 'bg-black/50 border-white/50'
                    }`}>
                      {selectedItems.has(item.id) && (
                        <Check className="text-white" size={14} />
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-xs border border-purple-500/30">
                      {item.color}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">{item.price}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.type}</h3>
                  <p className="text-xs text-gray-300 mb-3 line-clamp-2">{item.description}</p>

                  {!selectionMode && (
                    <button 
                      onClick={() => window.location.href = `/try-on/${item.id}`}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-all duration-300"
                    >
                      Try On Solo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6">
            <h2 className="text-xl font-bold gradient-text text-center mb-6">Add New Item</h2>

            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-400 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="text-purple-400 mx-auto mb-2" size={32} />
                  <p className="text-gray-400 text-sm">Tap to take photo</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Item name"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              />

              <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white">
                <option value="">Select category</option>
                <option value="tops">Tops</option>
                <option value="bottoms">Bottoms</option>
                <option value="outerwear">Outerwear</option>
                <option value="shoes">Shoes</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
