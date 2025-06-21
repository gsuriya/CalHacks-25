#!/usr/bin/env node

/**
 * Generate Product Filters Map
 * 
 * This script fetches all products from the FastAPI backend and creates a static
 * JSON map of product attributes for filtering. Run this script whenever you need
 * to update the filters data.
 * 
 * Usage: node scripts/generate-filters-map.js
 */

const fs = require('fs')
const path = require('path')

const API_BASE_URL = 'https://backend-879168005744.us-west1.run.app'

async function fetchAllProducts() {
  console.log('Fetching all products from API...')
  
  const response = await fetch(`${API_BASE_URL}/products`)
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`)
  }
  
  const products = await response.json()
  console.log(`Fetched ${products.length} products`)
  
  return products
}

function buildFiltersMap(products) {
  console.log('Building filters map...')
  
  const filtersMap = {}
  
  products.forEach(product => {
    filtersMap[product.id] = {
      color: product.color,
      price: product.price,
      store: product.type, // Using type as store for now
      inStock: product.stock,
      material: '',  // placeholder for LLM
      occasion: '', // placeholder for LLM  
      season: ''    // placeholder for LLM
    }
  })
  
  console.log(`Built filters map with ${Object.keys(filtersMap).length} products`)
  return filtersMap
}

function generateFilterOptions(filtersMap) {
  console.log('Generating filter options...')
  
  const products = Object.values(filtersMap)
  
  const filterOptions = {
    colors: [...new Set(products.map(p => p.color))].filter(Boolean).sort(),
    priceRange: {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price))
    },
    stores: [...new Set(products.map(p => p.store))].filter(Boolean).sort(),
    stockStatus: ['inStock', 'outOfStock', 'lowStock'],
    materials: [...new Set(products.map(p => p.material))].filter(Boolean).sort(),
    occasions: [...new Set(products.map(p => p.occasion))].filter(Boolean).sort(),
    seasons: [...new Set(products.map(p => p.season))].filter(Boolean).sort()
  }
  
  console.log('Filter options generated:', {
    colors: filterOptions.colors.length,
    stores: filterOptions.stores.length,
    priceRange: `$${filterOptions.priceRange.min} - $${filterOptions.priceRange.max}`
  })
  
  return filterOptions
}

function saveToFile(data, filename) {
  const filePath = path.join(process.cwd(), 'data', filename)
  
  // Ensure data directory exists
  const dataDir = path.dirname(filePath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  console.log(`Saved ${filename} to ${filePath}`)
}

async function main() {
  try {
    console.log('🚀 Starting product filters map generation...\n')
    
    // Fetch products from API
    const products = await fetchAllProducts()
    
    // Build filters map
    const filtersMap = buildFiltersMap(products)
    
    // Generate filter options
    const filterOptions = generateFilterOptions(filtersMap)
    
    // Save both files
    saveToFile(filtersMap, 'product-filters-map.json')
    saveToFile(filterOptions, 'filter-options.json')
    
    // Generate metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalProducts: Object.keys(filtersMap).length,
      apiUrl: API_BASE_URL,
      version: '1.0.0'
    }
    
    saveToFile(metadata, 'filters-metadata.json')
    
    console.log('\n✅ Product filters map generation completed successfully!')
    console.log('\nGenerated files:')
    console.log('  - data/product-filters-map.json (main filters map)')
    console.log('  - data/filter-options.json (UI filter options)')
    console.log('  - data/filters-metadata.json (generation metadata)')
    console.log('\nThese files are now ready to be committed to your repository.')
    
  } catch (error) {
    console.error('❌ Error generating filters map:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fetchAllProducts, buildFiltersMap, generateFilterOptions } 