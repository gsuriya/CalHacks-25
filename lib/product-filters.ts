// Product Filter System
// Loads product attributes from static JSON files for efficient filtering

// Import the static data files
import productFiltersMapData from '../data/product-filters-map.json'
import filterOptionsData from '../data/filter-options.json'
import filtersMetadata from '../data/filters-metadata.json'

export interface ProductAttributes {
  color: string
  price: number
  store: string
  inStock: number
  material: string    // placeholder for LLM integration
  occasion: string    // placeholder for LLM integration
  season: string      // placeholder for LLM integration
}

export interface ProductFiltersMap {
  [productId: string]: ProductAttributes
}

export interface ApiProduct {
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

export interface FilterOptions {
  colors: string[]
  priceRange: { min: number; max: number }
  stores: string[]
  stockStatus: ('inStock' | 'outOfStock' | 'lowStock')[]
  materials: string[]    // will be populated by LLM later
  occasions: string[]    // will be populated by LLM later
  seasons: string[]      // will be populated by LLM later
}

export interface ActiveFilters {
  colors: string[]
  priceMin: number
  priceMax: number
  stores: string[]
  stockStatus: ('inStock' | 'outOfStock' | 'lowStock')[]
  materials: string[]
  occasions: string[]
  seasons: string[]
}

class ProductFilterManager {
  private filtersMap: ProductFiltersMap
  private filterOptions: FilterOptions
  
  constructor() {
    // Load data from static JSON files
    this.filtersMap = productFiltersMapData as ProductFiltersMap
    this.filterOptions = filterOptionsData as FilterOptions
    
    console.log(`Loaded filters map with ${Object.keys(this.filtersMap).length} products`)
    console.log(`Generated on: ${filtersMetadata.generatedAt}`)
  }
  
  // Get the current filters map (now loads instantly from static data)
  getFiltersMap(): ProductFiltersMap {
    return this.filtersMap
  }
  
  // Get filter options for UI (now loads instantly from static data)
  getFilterOptions(): FilterOptions {
    return this.filterOptions
  }
  
  // Check if the filter system is ready (always true now since data is static)
  isReady(): boolean {
    return true
  }
  
  // Get metadata about the filters
  getMetadata() {
    return filtersMetadata
  }
  
  // Filter products based on active filters
  filterProducts(productIds: string[], activeFilters: ActiveFilters): string[] {
    return productIds.filter(productId => {
      const attributes = this.filtersMap[productId]
      if (!attributes) return false
      
      // Color filter
      if (activeFilters.colors.length > 0 && !activeFilters.colors.includes(attributes.color)) {
        return false
      }
      
      // Price filter
      if (attributes.price < activeFilters.priceMin || attributes.price > activeFilters.priceMax) {
        return false
      }
      
      // Store filter
      if (activeFilters.stores.length > 0 && !activeFilters.stores.includes(attributes.store)) {
        return false
      }
      
      // Stock status filter
      if (activeFilters.stockStatus.length > 0) {
        const stockStatus = this.getStockStatus(attributes.inStock)
        if (!activeFilters.stockStatus.includes(stockStatus)) {
          return false
        }
      }
      
      // Material filter (placeholder - will work once LLM populates data)
      if (activeFilters.materials.length > 0 && attributes.material && 
          !activeFilters.materials.includes(attributes.material)) {
        return false
      }
      
      // Occasion filter (placeholder - will work once LLM populates data)
      if (activeFilters.occasions.length > 0 && attributes.occasion && 
          !activeFilters.occasions.includes(attributes.occasion)) {
        return false
      }
      
      // Season filter (placeholder - will work once LLM populates data)
      if (activeFilters.seasons.length > 0 && attributes.season && 
          !activeFilters.seasons.includes(attributes.season)) {
        return false
      }
      
      return true
    })
  }
  
  // Helper to determine stock status
  private getStockStatus(stock: number): 'inStock' | 'outOfStock' | 'lowStock' {
    if (stock === 0) return 'outOfStock'
    if (stock <= 5) return 'lowStock'
    return 'inStock'
  }
  
  // Get product attributes by ID
  getProductAttributes(productId: string): ProductAttributes | null {
    return this.filtersMap[productId] || null
  }
  
  // Update LLM-based attributes (for future use)
  updateLLMAttributes(productId: string, updates: Partial<Pick<ProductAttributes, 'material' | 'occasion' | 'season'>>) {
    if (this.filtersMap[productId]) {
      this.filtersMap[productId] = {
        ...this.filtersMap[productId],
        ...updates
      }
      
      // Note: This only updates the in-memory copy. 
      // To persist changes, you'd need to regenerate the static files
      console.log(`Updated LLM attributes for product ${productId}:`, updates)
    }
  }
  
  // Bulk update LLM attributes (for batch processing)
  bulkUpdateLLMAttributes(updates: Record<string, Partial<Pick<ProductAttributes, 'material' | 'occasion' | 'season'>>>) {
    let updatedCount = 0
    
    Object.entries(updates).forEach(([productId, attrs]) => {
      if (this.filtersMap[productId]) {
        this.filtersMap[productId] = {
          ...this.filtersMap[productId],
          ...attrs
        }
        updatedCount++
      }
    })
    
    console.log(`Bulk updated LLM attributes for ${updatedCount} products`)
    
    // Update filter options to include new LLM-based values
    this.refreshFilterOptions()
  }
  
  // Refresh filter options after LLM updates
  private refreshFilterOptions() {
    const products = Object.values(this.filtersMap)
    
    this.filterOptions = {
      ...this.filterOptions,
      materials: [...new Set(products.map(p => p.material))].filter(Boolean).sort(),
      occasions: [...new Set(products.map(p => p.occasion))].filter(Boolean).sort(),
      seasons: [...new Set(products.map(p => p.season))].filter(Boolean).sort()
    }
  }
}

// Create singleton instance
export const productFilterManager = new ProductFilterManager()

// Default empty active filters
export const createDefaultActiveFilters = (filterOptions: FilterOptions): ActiveFilters => ({
  colors: [],
  priceMin: filterOptions.priceRange.min,
  priceMax: filterOptions.priceRange.max,
  stores: [],
  stockStatus: [],
  materials: [],
  occasions: [],
  seasons: []
}) 