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

// Helper function to intelligently assign material based on product type
const getMaterialForType = (type, index) => {
  const materials = {
    't-shirt': ['Cotton', 'Cotton Blend', 'Organic Cotton', 'Bamboo'],
    'long sleeve': ['Cotton', 'Cotton Blend', 'Merino Wool', 'Modal'],
    'sweater': ['Wool', 'Cashmere', 'Cotton Knit', 'Acrylic Blend'],
    'scarf': ['Silk', 'Wool', 'Cashmere', 'Cotton Blend']
  }
  const typeMaterials = materials[type.toLowerCase()] || ['Cotton', 'Polyester', 'Cotton Blend', 'Modal']
  return typeMaterials[index % typeMaterials.length]
}

// Helper function to assign occasion based on type and color
const getOccasionForItem = (type, color, index) => {
  const occasions = ['Casual', 'Work', 'Party', 'Weekend']
  
  // Smart assignment based on type and color
  if (type.toLowerCase().includes('sweater')) {
    return ['Work', 'Casual', 'Weekend'][index % 3]
  } else if (color.includes('black') || color.includes('navy') || color.includes('charcoal')) {
    return ['Work', 'Party', 'Casual'][index % 3]
  } else if (color.includes('white') || color.includes('cream') || color.includes('beige')) {
    return ['Casual', 'Work', 'Weekend'][index % 3]
  } else {
    return occasions[index % occasions.length]
  }
}

// Helper function to assign season (50% spring, 50% summer as requested)
const getSeasonForItem = (index) => {
  return index % 2 === 0 ? 'Spring' : 'Summer'
}

async function generateFiltersMap() {
  try {
    console.log('🚀 Starting to generate product filters map...')
    
    // Fetch all products from the API
    const response = await fetch('https://backend-879168005744.us-west1.run.app/products')
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }
    
    const apiProducts = await response.json()
    console.log(`📦 Fetched ${apiProducts.length} products from API`)
    
    const filtersMap = {}
    const totalProducts = apiProducts.length
    
    // Process products in batches
    const batchSize = 10
    let productIndex = 0
    
    for (let i = 0; i < apiProducts.length; i += batchSize) {
      const batch = apiProducts.slice(i, i + batchSize)
      console.log(`⚙️  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(totalProducts/batchSize)}...`)
      
      const batchPromises = batch.map(async (product, batchIndex) => {
        try {
          const displayResponse = await fetch(
            `https://backend-879168005744.us-west1.run.app/products/${product.id}/display`
          )
          if (displayResponse.ok) {
            const displayData = await displayResponse.json()
            const priceNum = parseFloat(displayData.price.replace('$', ''))
            const currentIndex = productIndex + batchIndex
            
            // Build filter map entry with smart attribute assignment
            filtersMap[displayData.id] = {
              color: displayData.color,
              price: priceNum,
              store: displayData.type,
              inStock: displayData.stock,
              material: getMaterialForType(displayData.type, currentIndex),
              occasion: getOccasionForItem(displayData.type, displayData.color, currentIndex),
              season: getSeasonForItem(currentIndex),
            }
            
            return true
          }
        } catch (error) {
          console.error(`❌ Error processing product ${product.id}:`, error)
        }
        return false
      })
      
      await Promise.all(batchPromises)
      productIndex += batchSize
    }
    
    console.log(`✅ Successfully processed ${Object.keys(filtersMap).length} products`)
    
    // Generate filter options from the map
    const allColors = [...new Set(Object.values(filtersMap).map(p => p.color))].sort()
    const allStores = [...new Set(Object.values(filtersMap).map(p => p.store))].sort()
    const allMaterials = [...new Set(Object.values(filtersMap).map(p => p.material))].sort()
    const allOccasions = [...new Set(Object.values(filtersMap).map(p => p.occasion))].sort()
    const allSeasons = [...new Set(Object.values(filtersMap).map(p => p.season))].sort()
    const allPrices = Object.values(filtersMap).map(p => p.price)
    
    const filterOptions = {
      colors: allColors,
      stores: allStores,
      materials: allMaterials,
      occasions: allOccasions,
      seasons: allSeasons,
      priceRange: {
        min: Math.floor(Math.min(...allPrices)),
        max: Math.ceil(Math.max(...allPrices))
      }
    }
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalProducts: Object.keys(filtersMap).length,
      filterCounts: {
        colors: allColors.length,
        stores: allStores.length,
        materials: allMaterials.length,
        occasions: allOccasions.length,
        seasons: allSeasons.length
      }
    }
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Write the files
    const filtersMapPath = path.join(dataDir, 'product-filters-map.json')
    const filterOptionsPath = path.join(dataDir, 'filter-options.json')
    const metadataPath = path.join(dataDir, 'filters-metadata.json')
    
    fs.writeFileSync(filtersMapPath, JSON.stringify(filtersMap, null, 2))
    fs.writeFileSync(filterOptionsPath, JSON.stringify(filterOptions, null, 2))
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    
    console.log('📁 Generated files:')
    console.log(`   - ${filtersMapPath}`)
    console.log(`   - ${filterOptionsPath}`)
    console.log(`   - ${metadataPath}`)
    
    console.log('\n📊 Filter Distribution:')
    console.log(`   - Colors: ${allColors.length}`)
    console.log(`   - Stores: ${allStores.length}`)
    console.log(`   - Materials: ${allMaterials.length}`)
    console.log(`   - Occasions: ${allOccasions.length}`)
    console.log(`   - Seasons: ${allSeasons.length}`)
    console.log(`   - Price Range: $${filterOptions.priceRange.min} - $${filterOptions.priceRange.max}`)
    
    console.log('\n🎉 Product filters map generated successfully!')
    
  } catch (error) {
    console.error('💥 Error generating filters map:', error)
    process.exit(1)
  }
}

// Run the script
generateFiltersMap()

module.exports = { generateFiltersMap } 