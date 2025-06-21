"use client"
import { useState, useEffect } from "react"
import { X, Heart, Shirt, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"

interface Product {
  id: string
  image: string
  description: string
  type: string
  color: string
  graphic: string
  variant: string
  stock: number
  price: string
  created_at: string
  stock_status: string
}

interface ApiProduct {
  id: string
  image_path: string
  description: string
  type: string
  color: string
  graphic: string
  variant: string
  stock: number
  price: number
  created_at: string
}

export default function SwipePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())

  // Fetch ALL products from the API
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        setLoadingProgress(0)
        
        console.log('Starting to fetch all products...')
        
        // Fetch all products from the API
        const response = await fetch('https://backend-879168005744.us-west1.run.app/products')
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }
        
        const apiProducts: ApiProduct[] = await response.json()
        console.log(`Fetched ${apiProducts.length} products from API`)
        
        setLoadingProgress(10) // 10% - Got product list
        
        // Fetch display data for ALL products to get base64 images
        const totalProducts = apiProducts.length
        const productsWithImages: Product[] = []
        
        // Process products in batches to avoid overwhelming the API
        const batchSize = 10
        for (let i = 0; i < apiProducts.length; i += batchSize) {
          const batch = apiProducts.slice(i, i + batchSize)
          
          const batchPromises = batch.map(async (product, batchIndex) => {
            try {
              const displayResponse = await fetch(
                `https://backend-879168005744.us-west1.run.app/products/${product.id}/display`
              )
              if (displayResponse.ok) {
                const displayData = await displayResponse.json()
                console.log(`Loaded product ${i + batchIndex + 1}/${totalProducts}: ${displayData.type}`)
                return {
                  id: displayData.id,
                  image: displayData.image, // This is the base64 encoded image
                  description: displayData.description,
                  type: displayData.type,
                  color: displayData.color,
                  graphic: displayData.graphic,
                  variant: displayData.variant,
                  stock: displayData.stock,
                  price: displayData.price, // Already formatted as string like "$26.62"
                  created_at: displayData.created_at,
                  stock_status: displayData.stock_status
                }
              } else {
                // Fallback to original product data with placeholder image
                console.warn(`Failed to load display data for product ${product.id}, using fallback`)
                return {
                  id: product.id,
                  image: "/placeholder.svg?height=600&width=400",
                  description: product.description,
                  type: product.type,
                  color: product.color,
                  graphic: product.graphic,
                  variant: product.variant,
                  stock: product.stock,
                  price: `$${product.price.toFixed(2)}`,
                  created_at: product.created_at,
                  stock_status: product.stock > 0 ? "In Stock" : "Out of Stock"
                }
              }
            } catch (error) {
              console.error(`Error fetching display data for product ${product.id}:`, error)
              return {
                id: product.id,
                image: "/placeholder.svg?height=600&width=400",
                description: product.description,
                type: product.type,
                color: product.color,
                graphic: product.graphic,
                variant: product.variant,
                stock: product.stock,
                price: `$${product.price.toFixed(2)}`,
                created_at: product.created_at,
                stock_status: product.stock > 0 ? "In Stock" : "Out of Stock"
              }
            }
          })
          
          const batchResults = await Promise.all(batchPromises)
          productsWithImages.push(...batchResults)
          
          // Update progress
          const progress = 10 + ((i + batchSize) / totalProducts) * 90
          setLoadingProgress(Math.min(progress, 100))
        }
        
        console.log(`Successfully loaded ${productsWithImages.length} products with images`)
        
        setAllProducts(productsWithImages)
        setFilteredProducts(productsWithImages)
        
        // Set initial random product
        if (productsWithImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * productsWithImages.length)
          setCurrentProduct(productsWithImages[randomIndex])
        }
        
        setLoadingProgress(100)
      } catch (error) {
        console.error('Error fetching products:', error)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllProducts()
  }, [])

  const getRandomProduct = (productList: Product[] = filteredProducts) => {
    if (productList.length === 0) return null
    const randomIndex = Math.floor(Math.random() * productList.length)
    return productList[randomIndex]
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentProduct) return

    if (direction === "right") {
      // Like the product
      setLikedProducts(prev => new Set([...prev, currentProduct.id]))
    }

    // Get a new random product from filtered list
    const nextProduct = getRandomProduct()
    setCurrentProduct(nextProduct)
  }

  const handleNavigation = (direction: "left" | "right") => {
    if (!currentProduct) return

    // Just navigate to next product without liking
    const nextProduct = getRandomProduct()
    setCurrentProduct(nextProduct)
  }

  const getOccasionFromType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'T-Shirt': 'Casual',
      'Sweater': 'Casual',
      'Dress': 'Party',
      'Blazer': 'Work',
      'Jacket': 'Casual',
      'Pants': 'Casual',
      'Shirt': 'Work'
    }
    return typeMap[type] || 'Casual'
  }

  const getVibeFromDescription = (description: string): string => {
    const desc = description.toLowerCase()
    if (desc.includes('professional') || desc.includes('formal')) return 'Professional'
    if (desc.includes('bold') || desc.includes('vibrant')) return 'Bold'
    if (desc.includes('minimalist') || desc.includes('simple')) return 'Minimalist'
    if (desc.includes('trendy') || desc.includes('stylish')) return 'Trendy'
    return 'Stylish'
  }

  // Get unique values for filters
  const getUniqueTypes = () => {
    return [...new Set(allProducts.map(p => p.type))].sort()
  }

  const getUniqueColors = () => {
    return [...new Set(allProducts.map(p => p.color))].sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen relative pb-20">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2">Loading fashion items...</p>
            <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm">{Math.round(loadingProgress)}% complete</p>
            <p className="text-gray-500 text-xs mt-2">
              {loadingProgress < 10 ? 'Fetching product list...' :
               loadingProgress < 100 ? `Loading product images...` :
               'Almost ready!'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative pb-20">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen relative pb-20">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <p className="text-white text-lg">No products available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold gradient-text">Discover Your Style</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{allProducts.length} items loaded</p>
            <p className="text-gray-500 text-xs">{filteredProducts.length} available</p>
          </div>
        </div>

        {/* Product Card with Side Navigation */}
        <div className="relative">
          {/* Left Swipe Button - Positioned outside left edge */}
          <button
            onClick={() => handleNavigation("left")}
            className="absolute left-[-70px] top-1/2 transform -translate-y-1/2 w-14 h-14 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 group z-10"
            aria-label="Swipe left"
          >
            <ChevronLeft 
              className="text-gray-400 group-hover:text-red-400 transition-colors duration-300" 
              size={28} 
            />
          </button>

          {/* Right Swipe Button - Positioned outside right edge */}
          <button
            onClick={() => handleNavigation("right")}
            className="absolute right-[-70px] top-1/2 transform -translate-y-1/2 w-14 h-14 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 group z-10"
            aria-label="Swipe right"
          >
            <ChevronRight 
              className="text-gray-400 group-hover:text-green-400 transition-colors duration-300" 
              size={28} 
            />
          </button>

          {/* Product Card - Back to original full width */}
          <div className="glass-card rounded-3xl overflow-hidden mb-6 transform transition-all duration-300 hover:scale-105">
            <div className="relative">
              <img 
                src={currentProduct.image} 
                alt={currentProduct.description} 
                className="w-full h-96 object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=400"
                }}
              />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white font-semibold">{currentProduct.price}</span>
              </div>
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm">{currentProduct.stock_status}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-sm border border-purple-500/30">
                  {currentProduct.type}
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full text-sm border border-blue-500/30">
                  {currentProduct.color}
                </span>
                {currentProduct.variant && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full text-sm border border-green-500/30">
                    Variant {currentProduct.variant}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-300">{currentProduct.description}</p>
                {currentProduct.graphic && (
                  <p className="text-gray-400 text-sm">Design: {currentProduct.graphic}</p>
                )}
              </div>

              <div className="flex gap-4 mt-4 text-sm text-gray-400">
                <span>👗 {getOccasionFromType(currentProduct.type)}</span>
                <span>✨ {getVibeFromDescription(currentProduct.description)}</span>
                <span>📦 Stock: {currentProduct.stock}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
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
            onClick={() => {
              if (currentProduct) {
                window.location.href = `/try-on/${currentProduct.id}`
              }
            }}
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

        {/* Liked Products Counter */}
        {likedProducts.size > 0 && (
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              ❤️ {likedProducts.size} item{likedProducts.size !== 1 ? 's' : ''} liked
            </p>
          </div>
        )}
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
              {/* Product Types */}
              <div>
                <h3 className="font-semibold mb-3">Product Types ({getUniqueTypes().length})</h3>
                <div className="flex flex-wrap gap-2">
                  {getUniqueTypes().map((type) => (
                    <button
                      key={type}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h3 className="font-semibold mb-3">Colors ({getUniqueColors().length})</h3>
                <div className="flex flex-wrap gap-2">
                  {getUniqueColors().map((color) => (
                    <button
                      key={color}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <h3 className="font-semibold mb-3">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  {["In Stock", "Low Stock", "All Items"].map((status) => (
                    <button
                      key={status}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all duration-300"
                    >
                      {status}
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
