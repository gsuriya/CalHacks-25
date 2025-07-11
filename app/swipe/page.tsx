"use client"
import { useState, useEffect } from "react"
import { Heart, Shirt, Filter, ChevronLeft, ChevronRight, Palette, Plus } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"
import { isColorMatch, getSkinToneDescription, SkinToneAnalysis } from "../../lib/skin-tone-analysis"
import { getStoredSkinTone, useSkinToneListener } from "../../lib/skin-tone-storage"

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

// Data structure for the filter map
interface ProductFilterAttributes {
  color: string
  price: number
  store: string
  inStock: number
  material: string
  occasion: string
  season: string
  type: string
}

// Data structure for the filter options UI
interface FilterOptions {
  colors: string[]
  stores: string[]
  materials: string[]
  occasions: string[]
  seasons: string[]
  priceRange: { min: number; max: number }
  type: string[]
}

// Data structure for the active filter state
interface ActiveFilters {
  colors: string[]
  stores: string[]
  materials: string[]
  occasions: string[]
  seasons: string[]
  priceMin: number
  priceMax: number
  inStock: boolean
  type: string[]
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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideInDirection, setSlideInDirection] = useState<'left' | 'right' | null>(null)
  
  // Skin tone analysis state
  const [skinToneAnalysis, setSkinToneAnalysis] = useState<SkinToneAnalysis | null>(null)
  const [skinToneMatching, setSkinToneMatching] = useState(false)

  // Filter system state - now loads from static files
  const [productFiltersMap, setProductFiltersMap] = useState<Record<string, ProductFilterAttributes>>({})
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters | null>(null)
  const [filterSystemReady, setFilterSystemReady] = useState(false)

  // Load closet items and check for similar items
  const [closetItems, setClosetItems] = useState<Array<{
    id: string
    name: string
    type: string
    color: string
    image: string
    price: string
    description: string
  }>>([])

  // Load stored skin tone analysis on component mount
  useEffect(() => {
    const stored = getStoredSkinTone()
    if (stored) {
      setSkinToneAnalysis(stored)
    }
  }, [])

  // Listener for skin tone updates from other pages
  useSkinToneListener(analysis => {
    console.log("Skin tone updated via listener:", analysis)
    setSkinToneAnalysis(analysis)
  })

  // Load closet items from localStorage
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

  // Check for voice-extracted filters and apply them
  useEffect(() => {
    const handleVoiceFilters = () => {
      const voiceFilters = localStorage.getItem('activeFilters')
      console.log('🔍 Checking localStorage for activeFilters:', voiceFilters)
      
      if (voiceFilters && filterOptions && activeFilters) {
        try {
          const parsedFilters = JSON.parse(voiceFilters)
          console.log('📋 Raw voice filters from localStorage:', JSON.stringify(parsedFilters, null, 2))
          
          // Convert single-value voice filters to array format for UI
          const mergedFilters = {
            ...activeFilters,
            // Convert single values to arrays, preserving existing arrays if no new value
            colors: parsedFilters.color ? [parsedFilters.color] : activeFilters.colors,
            type: parsedFilters.type ? [parsedFilters.type] : activeFilters.type,
            stores: parsedFilters.store ? [parsedFilters.store] : activeFilters.stores,
            materials: parsedFilters.material ? [parsedFilters.material] : activeFilters.materials,
            occasions: parsedFilters.occasion ? [parsedFilters.occasion] : activeFilters.occasions,
            seasons: parsedFilters.season ? [parsedFilters.season] : activeFilters.seasons,
            // Handle numeric and boolean fields
            priceMin: parsedFilters.priceMin !== null ? parsedFilters.priceMin : activeFilters.priceMin,
            priceMax: parsedFilters.priceMax !== null ? parsedFilters.priceMax : activeFilters.priceMax,
            inStock: parsedFilters.inStockMin !== null ? parsedFilters.inStockMin > 0 : activeFilters.inStock,
          }
          
          console.log('🔄 Filter conversion:')
          console.log('  - color:', parsedFilters.color, '→ colors:', mergedFilters.colors)
          console.log('  - type:', parsedFilters.type, '→ type:', mergedFilters.type)
          console.log('  - store:', parsedFilters.store, '→ stores:', mergedFilters.stores)
          
          console.log('🔍 Detailed conversion check:')
          console.log('  - parsedFilters.type value:', parsedFilters.type)
          console.log('  - parsedFilters.type type:', typeof parsedFilters.type)
          console.log('  - parsedFilters.type === null:', parsedFilters.type === null)
          console.log('  - Boolean check result:', parsedFilters.type ? [parsedFilters.type] : activeFilters.type)
          
          console.log('📊 Final merged filters:', JSON.stringify(mergedFilters, null, 2))
          
          setActiveFilters(mergedFilters)
          console.log('✅ setActiveFilters called with merged filters')
          
          // Clear the stored filters
          localStorage.removeItem('activeFilters')
          console.log('🗑️ Cleared activeFilters from localStorage')
        } catch (error) {
          console.error('❌ Failed to apply voice filters:', error)
          localStorage.removeItem('activeFilters') // Clear invalid data
        }
      } else {
        console.log('⏭️ Skipping voice filter application:', {
          hasVoiceFilters: !!voiceFilters,
          hasFilterOptions: !!filterOptions,
          hasActiveFilters: !!activeFilters
        })
      }
    }

    // Listen for voice filter events
    const handleVoiceFilterEvent = (event: CustomEvent) => {
      console.log('🎧 Voice filter event received:', event.detail)
      
      if (event.detail.filters) {
        const voiceFilters = event.detail.filters
        console.log('🎧 Voice filters from event:', JSON.stringify(voiceFilters, null, 2))
        console.log('🎧 Individual filter values from event:')
        console.log('  - color:', voiceFilters.color, '(type:', typeof voiceFilters.color, ')')
        console.log('  - type:', voiceFilters.type, '(type:', typeof voiceFilters.type, ')')
        console.log('  - store:', voiceFilters.store, '(type:', typeof voiceFilters.store, ')')
        
        // Update active filters directly from event data
        setActiveFilters(prev => {
          if (!prev) {
            console.log('🎧 No previous filters, skipping update')
            return prev
          }
          
          console.log('🎧 Previous filters:', JSON.stringify(prev, null, 2))
          
          const newFilters = {
            ...prev,
            colors: voiceFilters.color ? [voiceFilters.color] : prev.colors,
            type: voiceFilters.type ? [voiceFilters.type] : prev.type,
            stores: voiceFilters.store ? [voiceFilters.store] : prev.stores,
            materials: voiceFilters.material ? [voiceFilters.material] : prev.materials,
            occasions: voiceFilters.occasion ? [voiceFilters.occasion] : prev.occasions,
            seasons: voiceFilters.season ? [voiceFilters.season] : prev.seasons,
            priceMin: voiceFilters.priceMin !== null ? voiceFilters.priceMin : prev.priceMin,
            priceMax: voiceFilters.priceMax !== null ? voiceFilters.priceMax : prev.priceMax,
            inStock: voiceFilters.inStockMin !== null ? voiceFilters.inStockMin > 0 : prev.inStock,
          }
          
          console.log('🎧 New filters after conversion:', JSON.stringify(newFilters, null, 2))
          console.log('🎧 Filter changes:')
          console.log('  - colors:', prev.colors, '→', newFilters.colors)
          console.log('  - type:', prev.type, '→', newFilters.type)
          console.log('  - stores:', prev.stores, '→', newFilters.stores)
          
          return newFilters
        })
      }
      
      // Check if this is an enhanced event with skin tone data
      const { enableSkinToneMatching: enableMatching, skinTone } = event.detail
      if (enableMatching && skinTone) {
        setSkinToneAnalysis(skinTone)
        setSkinToneMatching(true)
      }
    }

    // Add event listeners
    window.addEventListener('voiceFilterUpdate', handleVoiceFilterEvent as EventListener)

    // Initial check for filters
    handleVoiceFilters()

    // Cleanup
    return () => {
      window.removeEventListener('voiceFilterUpdate', handleVoiceFilterEvent as EventListener)
    }
  }, [filterOptions, activeFilters])

  // Check for old voice-extracted filters and apply them
  useEffect(() => {
    const voiceFilters = localStorage.getItem('voiceExtractedFilters')
    if (voiceFilters && filterOptions && activeFilters) {
      try {
        const parsedFilters = JSON.parse(voiceFilters)
        console.log('Applying voice-extracted filters:', parsedFilters)
        
        // Merge voice filters with current active filters
        const mergedFilters = {
          ...activeFilters,
          // Apply voice filters, keeping existing defaults for missing fields
          colors: parsedFilters.colors || activeFilters.colors,
          stores: parsedFilters.stores || activeFilters.stores,
          type: parsedFilters.type || activeFilters.type,
          materials: parsedFilters.materials || activeFilters.materials,
          occasions: parsedFilters.occasions || activeFilters.occasions,
          seasons: parsedFilters.seasons || activeFilters.seasons,
          priceMin: parsedFilters.priceMin !== undefined ? parsedFilters.priceMin : activeFilters.priceMin,
          priceMax: parsedFilters.priceMax !== undefined ? parsedFilters.priceMax : activeFilters.priceMax,
          inStock: parsedFilters.inStock !== undefined ? parsedFilters.inStock : activeFilters.inStock,
        }
        
        setActiveFilters(mergedFilters)
        
        // Clear the stored filters
        localStorage.removeItem('voiceExtractedFilters')
        
        console.log('Successfully applied voice filters:', mergedFilters)
        
      } catch (error) {
        console.error('Failed to apply voice filters:', error)
        localStorage.removeItem('voiceExtractedFilters') // Clear invalid data
      }
    }
  }, [filterOptions, activeFilters])

  // Load static filter data and fetch products
  useEffect(() => {
    const loadFilterDataAndProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        setLoadingProgress(0)
        
        console.log('Loading static filter data...')
        
        // Load static filter data
        const [filtersMapResponse, filterOptionsResponse] = await Promise.all([
          fetch('/product-filters-map.json'),
          fetch('/filter-options.json')
        ])
        
        if (!filtersMapResponse.ok || !filterOptionsResponse.ok) {
          throw new Error('Failed to load filter data files')
        }
        
        const filtersMapData: Record<string, ProductFilterAttributes> = await filtersMapResponse.json()
        const filterOptionsData: FilterOptions = await filterOptionsResponse.json()
        
        setProductFiltersMap(filtersMapData)
        setFilterOptions(filterOptionsData)
        
        // Set initial active filters with all required fields
        const initialFilters: ActiveFilters = {
          colors: [] as string[],
          stores: [] as string[],
          materials: [] as string[],
          occasions: [] as string[],
          seasons: [] as string[],
          type: [] as string[],
          priceMin: filterOptionsData.priceRange.min,
          priceMax: filterOptionsData.priceRange.max,
          inStock: true,
        }
        
        setActiveFilters(initialFilters)
        
        setFilterSystemReady(true)
        setLoadingProgress(20)
        
        console.log('Static filter data loaded successfully')
        
        // Create local products from the filter map (like our pants)
        const localProducts: Product[] = []
        Object.entries(filtersMapData).forEach(([id, attributes]) => {
          // Check if this entry has an image field (indicating it's a local product)
          if ((attributes as any).image) {
            const localProduct: Product = {
              id: id,
              image: (attributes as any).image,
              description: (attributes as any).design || `${attributes.color} ${(attributes as any).type || 'Item'}`,
              type: (attributes as any).type || 'Clothing',
              color: attributes.color,
              graphic: (attributes as any).category || 'Local',
              variant: attributes.store,
              stock: attributes.inStock,
              price: `$${attributes.price}`,
              created_at: new Date().toISOString(),
              stock_status: attributes.inStock > 0 ? 'in_stock' : 'out_of_stock'
            }
            localProducts.push(localProduct)
          }
        })
        
        console.log(`Created ${localProducts.length} local products`)
        console.log('Starting to fetch products from API...')
        
        // Now fetch products from API
        const response = await fetch('https://backend-879168005744.us-west1.run.app/products')
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }
        
        const apiProducts: ApiProduct[] = await response.json()
        console.log(`Fetched ${apiProducts.length} products from API`)
        setLoadingProgress(30)

        const totalProducts = apiProducts.length
        const productsWithImages: Product[] = []
        
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
                
                return {
                  id: displayData.id,
                  image: displayData.image,
                  description: displayData.description,
                  type: displayData.type,
                  color: displayData.color,
                  graphic: displayData.graphic,
                  variant: displayData.variant,
                  stock: displayData.stock,
                  price: displayData.price,
                  created_at: displayData.created_at,
                  stock_status: displayData.stock_status,
                }
              }
            } catch (error) {
               console.error(`Error processing product ${product.id}:`, error)
            }
            return null
          })
          
          const batchResults = (await Promise.all(batchPromises)).filter(p => p !== null) as Product[]
          productsWithImages.push(...batchResults)
          
          const progress = 30 + ((i + batchSize) / totalProducts) * 70
          setLoadingProgress(Math.min(progress, 100))
        }
        
        console.log(`Successfully loaded ${productsWithImages.length} API products with images`)
        
        // Combine local products with API products
        const allCombinedProducts = [...localProducts, ...productsWithImages]
        console.log(`Total products (local + API): ${allCombinedProducts.length}`)
        setAllProducts(allCombinedProducts)
        setLoadingProgress(100)

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadFilterDataAndProducts()
  }, [])

  // Effect to apply filters when they change
  useEffect(() => {
    console.log('🔍 Filter application effect triggered:', {
      filterSystemReady,
      allProductsLength: allProducts.length,
      hasActiveFilters: !!activeFilters
    })
    
    if (!filterSystemReady || allProducts.length === 0) {
      console.log('⏭️ Skipping filter application - system not ready')
      return
    }

    let productsToFilter = [...allProducts]
    console.log('📦 Starting with', productsToFilter.length, 'products')

    // Apply skin tone matching first if enabled
    if (skinToneMatching && skinToneAnalysis) {
      productsToFilter = productsToFilter.filter(product => {
        const productColorHex = getProductColorHex(product.color)
        return isColorMatch(productColorHex, skinToneAnalysis)
      })
      console.log('🎨 After skin tone matching:', productsToFilter.length, 'products')
    }

    // Apply active filters using the static filter map
    if (activeFilters) {
      console.log('🔧 Applying active filters:', {
        colors: activeFilters.colors,
        type: activeFilters.type,
        stores: activeFilters.stores,
        materials: activeFilters.materials,
        occasions: activeFilters.occasions,
        seasons: activeFilters.seasons
      })
      
      const filtered = productsToFilter.filter(product => {
        const attributes = productFiltersMap[product.id]
        if (!attributes) {
          console.log('❌ No attributes found for product', product.id)
          return false
        }
        
        const { colors, stores, type, materials, occasions, seasons, priceMin, priceMax, inStock } = activeFilters
        
        // Type assertions for attributes since we know the structure
        const typedAttributes = attributes as ProductFilterAttributes
        
        // Check each filter
        const colorMatch = colors.length === 0 || colors.includes(typedAttributes.color)
        const storeMatch = stores.length === 0 || stores.includes(typedAttributes.store)
        const typeMatch = type.length === 0 || type.includes(typedAttributes.type)
        const materialMatch = materials.length === 0 || materials.includes(typedAttributes.material)
        const occasionMatch = occasions.length === 0 || occasions.includes(typedAttributes.occasion)
        const seasonMatch = seasons.length === 0 || seasons.includes(typedAttributes.season)
        const priceMatch = typedAttributes.price >= priceMin && typedAttributes.price <= priceMax
        const stockMatch = !inStock || typedAttributes.inStock > 0
        
        const passes = colorMatch && storeMatch && typeMatch && materialMatch && occasionMatch && seasonMatch && priceMatch && stockMatch
        
        if (!passes) {
          console.log(`🚫 Product ${product.id} filtered out:`, {
            color: `${typedAttributes.color} ${colorMatch ? '✅' : '❌'}`,
            store: `${typedAttributes.store} ${storeMatch ? '✅' : '❌'}`,
            type: `${typedAttributes.type} ${typeMatch ? '✅' : '❌'}`,
            material: `${typedAttributes.material} ${materialMatch ? '✅' : '❌'}`,
            occasion: `${typedAttributes.occasion} ${occasionMatch ? '✅' : '❌'}`,
            season: `${typedAttributes.season} ${seasonMatch ? '✅' : '❌'}`,
            price: `${typedAttributes.price} ${priceMatch ? '✅' : '❌'}`,
            stock: `${typedAttributes.inStock} ${stockMatch ? '✅' : '❌'}`
          })
        }
        
        return passes
      })
      
      console.log('✅ After applying filters:', filtered.length, 'products remain')
      setFilteredProducts(filtered)
    } else {
      console.log('⏭️ No active filters, using all products')
      setFilteredProducts(productsToFilter)
    }
  }, [activeFilters, skinToneMatching, skinToneAnalysis, allProducts, filterSystemReady, productFiltersMap])

  // Effect to set the initial/next product when filtered list changes
  useEffect(() => {
    if (filteredProducts.length > 0) {
        const isCurrentProductInFilteredList = filteredProducts.some(p => p.id === currentProduct?.id)
        if (!currentProduct || !isCurrentProductInFilteredList) {
            const randomIndex = Math.floor(Math.random() * filteredProducts.length)
            setCurrentProduct(filteredProducts[randomIndex])
        }
    } else {
        setCurrentProduct(null)
    }
  }, [filteredProducts, currentProduct])

  // Track activeFilters changes
  useEffect(() => {
    console.log('🎛️ ActiveFilters state changed:', JSON.stringify(activeFilters, null, 2))
    if (activeFilters) {
      console.log('🎛️ Active filter summary:')
      console.log('  - colors:', activeFilters.colors)
      console.log('  - type:', activeFilters.type)
      console.log('  - stores:', activeFilters.stores)
      console.log('  - materials:', activeFilters.materials)
      console.log('  - occasions:', activeFilters.occasions)
      console.log('  - seasons:', activeFilters.seasons)
    }
  }, [activeFilters])

  const getRandomProduct = (productList: Product[] = filteredProducts) => {
    if (productList.length === 0) return null
    const randomIndex = Math.floor(Math.random() * productList.length)
    return productList[randomIndex]
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentProduct || isAnimating) return
    
    // Start swipe out animation
    setIsAnimating(true)
    setSwipeDirection(direction)
    
    // After swipe out completes, change product and slide in from opposite direction
    setTimeout(() => {
      setCurrentProduct(getRandomProduct())
      setSwipeDirection(null)
      
      // Set slide-in direction (opposite of swipe direction)
      const slideDirection = direction === 'left' ? 'right' : 'left'
      setSlideInDirection(slideDirection)
      
      // Clear slide-in animation after it completes
      setTimeout(() => {
        setSlideInDirection(null)
        setIsAnimating(false)
      }, 200)
    }, 200) // Swipe out duration
  }

  const handleLike = () => {
    if (!currentProduct) return
    setLikedProducts(prev => new Set([...prev, currentProduct.id]))
    // Show a brief "like added" message could be added here
  }

  const handleAddToCloset = () => {
    if (!currentProduct) return

    const closetItem = {
      id: currentProduct.id,
      name: currentProduct.description,
      type: currentProduct.type,
      color: currentProduct.color,
      image: currentProduct.image,
      price: currentProduct.price,
      description: currentProduct.description
    }

    // Get existing closet items
    const existingItems = localStorage.getItem('closetItems')
    let existingClosetItems = existingItems ? JSON.parse(existingItems) : []

    // Check if item already exists
    if (!existingClosetItems.some((item: any) => item.id === currentProduct.id)) {
      existingClosetItems.push(closetItem)
      localStorage.setItem('closetItems', JSON.stringify(existingClosetItems))
      
      // Update local state immediately for similarity checking
      setClosetItems(existingClosetItems)
      
      console.log('👔 Added to closet:', {
        item: closetItem,
        totalItems: existingClosetItems.length
      })
    }
    
    // Move to next product regardless
    setCurrentProduct(getRandomProduct())
  }
  
  const handleNavigation = (direction: "left" | "right") => {
    setCurrentProduct(getRandomProduct())
  }

  const handleFilterChange = (filterType: keyof ActiveFilters, value: any) => {
    if (!activeFilters) return
    
    let newFilters = { ...activeFilters }

    if (filterType === 'colors' || filterType === 'stores' || filterType === 'type' || filterType === 'materials' || filterType === 'occasions' || filterType === 'seasons') {
      const currentValues = newFilters[filterType] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      newFilters = { ...newFilters, [filterType]: newValues }
    } else {
      newFilters = { ...newFilters, [filterType]: value }
    }
    
    setActiveFilters(newFilters)
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

  // Convert color names to hex codes for skin tone analysis
  const getProductColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      // Basic colors
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'orange': '#FFA500',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',
      
      // Extended color variations
      'navy': '#000080',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'tan': '#D2B48C',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      'burgundy': '#800020',
      'maroon': '#800000',
      'olive': '#808000',
      'teal': '#008080',
      'turquoise': '#40E0D0',
      'coral': '#FF7F50',
      'salmon': '#FA8072',
      'khaki': '#F0E68C',
      'mint': '#98FB98',
      'lavender': '#E6E6FA',
      'ivory': '#FFFFF0',
      
      // Additional clothing color variations
      'crimson': '#DC143C',
      'scarlet': '#FF2400',
      'rose': '#FF66CC',
      'fuchsia': '#FF00FF',
      'magenta': '#FF00FF',
      'violet': '#8A2BE2',
      'indigo': '#4B0082',
      'cyan': '#00FFFF',
      'aqua': '#00FFFF',
      'lime': '#00FF00',
      'forest': '#228B22',
      'emerald': '#50C878',
      'jade': '#00A86B',
      'chartreuse': '#7FFF00',
      'amber': '#FFBF00',
      'bronze': '#CD7F32',
      'copper': '#B87333',
      'rust': '#B7410E',
      'mahogany': '#C04000',
      'chestnut': '#954535',
      'coffee': '#6F4E37',
      'chocolate': '#D2691E',
      'camel': '#C19A6B',
      'sand': '#C2B280',
      'wheat': '#F5DEB3',
      'pearl': '#F0EAD6',
      'champagne': '#F7E7CE',
      'nude': '#E3BC9A',
      'blush': '#DE5D83',
      'mauve': '#E0B0FF',
      'plum': '#DDA0DD',
      'lilac': '#C8A2C8',
      'periwinkle': '#CCCCFF',
      'slate': '#708090',
      'charcoal': '#36454F',
      'steel': '#4682B4',
      'cobalt': '#0047AB',
      'sapphire': '#0F52BA',
      'royal': '#4169E1',
      'midnight': '#191970',
      'denim': '#1560BD',
      'powder': '#B0E0E6',
      'sky': '#87CEEB',
      'ice': '#F0F8FF',
      'mint green': '#98FB98',
      'sea green': '#2E8B57',
      'pine': '#01796F',
      'sage': '#9CAF88',
      'moss': '#8A9A5B',
      'hunter': '#355E3B'
    }
    
    const normalizedColor = colorName.toLowerCase().trim()
    return colorMap[normalizedColor] || '#6B46C1' // Default to purple if color not found
  }

  // Check if current product is similar to items in closet
  const checkSimilarInCloset = (product: Product) => {
    if (!product || closetItems.length === 0) return null
    
    const similarItem = closetItems.find(item => 
      item.type.toLowerCase() === product.type.toLowerCase() && 
      item.color.toLowerCase() === product.color.toLowerCase()
    )
    
    if (similarItem) {
      console.log('👔 Similar item found in closet:', {
        current: { type: product.type, color: product.color },
        existing: { type: similarItem.type, color: similarItem.color, name: similarItem.name }
      })
    }
    
    return similarItem
  }

  const similarItemInCloset = currentProduct ? checkSimilarInCloset(currentProduct) : null

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
              {loadingProgress < 20 ? 'Loading filter system...' :
               loadingProgress < 30 ? 'Fetching product list...' :
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

  if (!currentProduct && filteredProducts.length === 0 && skinToneMatching && skinToneAnalysis) {
    // Show no matches message but keep full UI functional
    return (
      <div className="min-h-screen relative pb-20">
        <AnimatedBackground />

        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold gradient-text">Discover Your Style</h1>
            <div className="text-right">
              <p className="text-gray-400 text-sm">{allProducts.length} items loaded</p>
              <p className="text-gray-500 text-xs">
                0 available (skin matched)
              </p>
            </div>
          </div>

          {/* Skin Tone Analysis Section */}
          <div className="mb-6">
            <div className="glass-card rounded-full p-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-white/30"
                    style={{ backgroundColor: skinToneAnalysis.skinHex }}
                  ></div>
                  <p className="text-white font-semibold text-xs">
                    {getSkinToneDescription(skinToneAnalysis)}
                  </p>
                </div>
                <button
                  onClick={() => setSkinToneMatching(false)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Show All Items
                </button>
              </div>
            </div>
          </div>

          {/* No matches message */}
          <div className="glass-card rounded-3xl overflow-hidden mb-6 p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Palette className="text-purple-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Perfect Matches Found</h3>
              <p className="text-gray-300 mb-4">
                We couldn't find clothes that match your <span className="text-purple-400">{getSkinToneDescription(skinToneAnalysis)}</span> skin tone right now.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Don't worry! You can browse all {allProducts.length} items or take a new photo on the home page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setSkinToneMatching(false)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                  Browse All Items
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  Take Photo
                </button>
              </div>
            </div>
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
          <div className="text-center">
            <p className="text-white text-lg mb-4">No products match your filters</p>
            <button 
              onClick={() => {
                if (filterOptions) {
                  setActiveFilters({
                    colors: [],
                    stores: [],
                    materials: [],
                    occasions: [],
                    seasons: [],
                    type: [],
                    priceMin: filterOptions.priceRange.min,
                    priceMax: filterOptions.priceRange.max,
                    inStock: true,
                  })
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold gradient-text">Discover Your Style</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{allProducts.length} items loaded</p>
            <p className="text-gray-500 text-xs">
              {filteredProducts.length} available
              {skinToneMatching && skinToneAnalysis && (
                <span className="text-purple-400"> (skin matched)</span>
              )}
            </p>
          </div>
        </div>

        {/* Skin Tone Analysis Section */}
        <div className="mb-6">
          {skinToneAnalysis ? (
            <div className="glass-card rounded-full p-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-white/30"
                    style={{ backgroundColor: skinToneAnalysis.skinHex }}
                  ></div>
                  <p className="text-white font-semibold text-xs">
                    {getSkinToneDescription(skinToneAnalysis)}
                  </p>
                </div>
                <button
                  onClick={() => setSkinToneMatching(!skinToneMatching)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    skinToneMatching
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {skinToneMatching ? 'Matching' : 'Match'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/'}
              className="w-full glass-card rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-3">
                <Palette className="text-purple-400" size={24} />
                <div className="text-center">
                  <p className="text-white font-semibold">Take Photo on Home Page</p>
                  <p className="text-gray-400 text-sm">Get personalized color recommendations</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Product Card - Reduced height to fit screen without scrolling */}
        <div className={`glass-card rounded-3xl overflow-hidden mb-4 transform transition-all duration-300 hover:scale-105 h-[480px] flex flex-col ${
          swipeDirection === 'left' ? 'animate-swipe-left' : 
          swipeDirection === 'right' ? 'animate-swipe-right' :
          slideInDirection === 'left' ? 'animate-slide-in-from-left' :
          slideInDirection === 'right' ? 'animate-slide-in-from-right' : ''
        }`}>
          <div className="relative flex-shrink-0">
            <img 
              src={currentProduct.image} 
              alt={currentProduct.description} 
              className="w-full h-80 object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=400"
              }}
            />
            
            {/* Price and Stock Status - positioned to avoid overlap */}
            <div className={`absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 transition-all duration-300 ${similarItemInCloset ? 'mt-16' : ''}`}>
              <span className="text-white font-semibold">{currentProduct.price}</span>
            </div>
            <div className={`absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 transition-all duration-300 ${similarItemInCloset ? 'mt-16' : ''}`}>
              <span className="text-white text-sm">
                {currentProduct.stock_status}
              </span>
            </div>

            {/* Similar item warning - positioned to not overlap */}
            {similarItemInCloset && (
              <div className="absolute top-2 left-2 right-2 bg-gradient-to-r from-yellow-500/95 to-orange-500/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-yellow-400/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👔</span>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm leading-tight">
                      Similar item in closet
                    </p>
                    <p className="text-white/90 text-xs font-medium">
                      You own: {similarItemInCloset.name || `${similarItemInCloset.color} ${similarItemInCloset.type}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
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

            <div className="space-y-2 mb-4 flex-1">
              <p className="text-gray-300">{currentProduct.description}</p>
              {currentProduct.graphic && (
                <p className="text-gray-400 text-sm">Design: {currentProduct.graphic}</p>
              )}
            </div>

            <div className="flex gap-4 mt-auto pt-4 text-sm text-gray-400">
              <span>👗 {getOccasionFromType(currentProduct.type)}</span>
              <span>✨ {getVibeFromDescription(currentProduct.description)}</span>
              <span>📦 Stock: {currentProduct.stock}</span>
            </div>
          </div>
        </div>

        {/* Navigation and Action Layout */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Arrow */}
          <button
            onClick={() => handleSwipe("left")}
            disabled={isAnimating}
            className={`w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center animate-pulse-glow flex-shrink-0 transition-opacity duration-200 ${
              isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>

          {/* Action Buttons - Centered */}
          <div className="flex justify-center gap-3 flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={handleLike}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center animate-pulse-glow"
                aria-label="Like"
              >
                <Heart className="text-white" size={20} />
              </button>
              <span className="text-xs text-gray-400 mt-1">Like</span>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={handleAddToCloset}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center animate-pulse-glow"
                aria-label="Add to Closet"
              >
                <Plus className="text-white" size={20} />
              </button>
              <span className="text-xs text-gray-400 mt-1">Closet</span>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (currentProduct) {
                    window.location.href = `/try-on/${currentProduct.id}`
                  }
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center animate-pulse-glow"
                aria-label="Try on"
              >
                <Shirt className="text-white" size={20} />
              </button>
              <span className="text-xs text-gray-400 mt-1">Try On</span>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowFilters(true)}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center animate-pulse-glow"
                aria-label="Filters"
              >
                <Filter className="text-white" size={20} />
              </button>
              <span className="text-xs text-gray-400 mt-1">Filters</span>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => handleSwipe("right")}
            disabled={isAnimating}
            className={`w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse-glow flex-shrink-0 transition-opacity duration-200 ${
              isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Next"
          >
            <ChevronRight className="text-white" size={24} />
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
      {showFilters && filterOptions && activeFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md glass-card rounded-t-3xl p-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold gradient-text">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h3 className="font-semibold mb-3">Color ({filterOptions.colors.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleFilterChange('colors', color)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.colors.includes(color)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Store (Product Type) */}
              <div>
                <h3 className="font-semibold mb-3">Store ({filterOptions.stores.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.stores.map((store) => (
                    <button
                      key={store}
                      onClick={() => handleFilterChange('stores', store)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.stores.includes(store)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="flex justify-between items-center text-sm text-gray-300 mb-2">
                    <span>${activeFilters.priceMin}</span>
                    <span>${activeFilters.priceMax}</span>
                </div>
                <input
                  type="range"
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                  value={activeFilters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* In Stock */}
              <div>
                <h3 className="font-semibold mb-3">Availability</h3>
                <div className="flex items-center justify-between glass-card p-3 rounded-xl">
                    <label htmlFor="inStock" className="text-white">Show in-stock only</label>
                    <input 
                        id="inStock"
                        type="checkbox"
                        checked={activeFilters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600 ring-offset-gray-800 focus:ring-2"
                    />
                </div>
              </div>
              
              {/* Material */}
              <div>
                <h3 className="font-semibold mb-3">Material ({filterOptions.materials.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.materials.map((material) => (
                    <button
                      key={material}
                      onClick={() => handleFilterChange('materials', material)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.materials.includes(material)
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div>
                <h3 className="font-semibold mb-3">Occasion ({filterOptions.occasions.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.occasions.map((occasion) => (
                    <button
                      key={occasion}
                      onClick={() => handleFilterChange('occasions', occasion)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.occasions.includes(occasion)
                          ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season */}
              <div>
                <h3 className="font-semibold mb-3">Season ({filterOptions.seasons.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.seasons.map((season) => (
                    <button
                      key={season}
                      onClick={() => handleFilterChange('seasons', season)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.seasons.includes(season)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <h3 className="font-semibold mb-3">Type ({filterOptions.type.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.type.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('type', type)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                        activeFilters.type.includes(type)
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowFilters(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold mt-8 animate-pulse-glow"
            >
              Show {filteredProducts.length} Items
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
