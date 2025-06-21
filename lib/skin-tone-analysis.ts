/**
 * Skin Tone Analysis for Fashion Recommendations
 * Analyzes skin color and recommends matching clothing colors
 */

export interface SkinToneAnalysis {
  skinHex: string
  undertone: 'warm' | 'cool' | 'neutral'
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  recommendedColors: string[]
  avoidColors: string[]
}

/**
 * Extract dominant skin color from image using canvas
 */
export const analyzeSkinTone = async (imageDataUrl: string): Promise<SkinToneAnalysis> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Resize for faster processing
      canvas.width = 100
      canvas.height = 100
      
      ctx.drawImage(img, 0, 0, 100, 100)
      const imageData = ctx.getImageData(0, 0, 100, 100)
      
      // Extract skin tone (focus on center area where face usually is)
      const skinPixels = extractSkinPixels(imageData)
      const averageColor = getAverageColor(skinPixels)
      const skinHex = rgbToHex(averageColor.r, averageColor.g, averageColor.b)
      
      // Analyze undertone and season
      const analysis = analyzeSkinCharacteristics(averageColor)
      
      resolve({
        skinHex,
        ...analysis
      })
    }
    
    img.src = imageDataUrl
  })
}

/**
 * Extract likely skin pixels from image data
 */
const extractSkinPixels = (imageData: ImageData): number[][] => {
  const pixels: number[][] = []
  const data = imageData.data
  
  // Focus on center 60% of image (where face typically is)
  const startX = Math.floor(imageData.width * 0.2)
  const endX = Math.floor(imageData.width * 0.8)
  const startY = Math.floor(imageData.height * 0.2)
  const endY = Math.floor(imageData.height * 0.8)
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * imageData.width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Filter for skin-like colors (basic heuristic)
      if (isSkinLike(r, g, b)) {
        pixels.push([r, g, b])
      }
    }
  }
  
  return pixels
}

/**
 * Simple heuristic to identify skin-like pixels
 */
const isSkinLike = (r: number, g: number, b: number): boolean => {
  // Basic skin tone detection
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  
  return (
    r > 95 && g > 40 && b > 20 &&
    max - min > 15 &&
    Math.abs(r - g) > 15 &&
    r > g && r > b
  )
}

/**
 * Calculate average color from pixel array
 */
const getAverageColor = (pixels: number[][]): { r: number, g: number, b: number } => {
  if (pixels.length === 0) {
    // Fallback to medium skin tone
    return { r: 194, g: 154, b: 108 }
  }
  
  const sum = pixels.reduce(
    (acc, [r, g, b]) => ({
      r: acc.r + r,
      g: acc.g + g,
      b: acc.b + b
    }),
    { r: 0, g: 0, b: 0 }
  )
  
  return {
    r: Math.round(sum.r / pixels.length),
    g: Math.round(sum.g / pixels.length),
    b: Math.round(sum.b / pixels.length)
  }
}

/**
 * Analyze skin characteristics and determine season/undertone
 */
const analyzeSkinCharacteristics = (color: { r: number, g: number, b: number }) => {
  const { r, g, b } = color
  
  // Determine undertone based on RGB values
  const undertone = determineUndertone(r, g, b)
  const season = determineSeason(r, g, b, undertone)
  const { recommended, avoid } = getColorRecommendations(season, undertone)
  
  return {
    undertone,
    season,
    recommendedColors: recommended,
    avoidColors: avoid
  }
}

/**
 * Determine warm/cool/neutral undertone
 */
const determineUndertone = (r: number, g: number, b: number): 'warm' | 'cool' | 'neutral' => {
  const yellowness = (r + g) - b
  const pinkness = (r + b) - g
  
  if (yellowness > pinkness + 20) return 'warm'
  if (pinkness > yellowness + 20) return 'cool'
  return 'neutral'
}

/**
 * Determine color season
 */
const determineSeason = (r: number, g: number, b: number, undertone: string): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const brightness = (r + g + b) / 3
  const isLight = brightness > 140
  
  if (undertone === 'warm') {
    return isLight ? 'spring' : 'autumn'
  } else {
    return isLight ? 'summer' : 'winter'
  }
}

/**
 * Get color recommendations based on season and undertone
 */
const getColorRecommendations = (season: string, undertone: string) => {
  const colorMap = {
    spring: {
      recommended: [
        // Warm & Bright Colors
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF',
        '#FF0000', '#FFA500', '#FFFF00', '#FFD700', '#FF7F50', '#FF69B4', '#00FF00',
        '#32CD32', '#ADFF2F', '#00CED1', '#1E90FF', '#FF1493', '#FF6347', '#FFA502',
        '#F39C12', '#E74C3C', '#E67E22', '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F',
        '#FF8C00', '#DC143C', '#00BFFF', '#FF4500', '#DA70D6', '#20B2AA', '#87CEEB',
        '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C', '#FA8072', '#40E0D0', '#EE82EE'
      ],
      avoid: []
    },
    summer: {
      recommended: [
        // Soft & Cool Colors  
        '#A8E6CF', '#88D8C0', '#FFD3A5', '#FD99A9', '#C7CEEA', '#B8B8D4',
        '#E6E6FA', '#B0C4DE', '#87CEEB', '#F0F8FF', '#E0FFFF', '#F5FFFA',
        '#FFF8DC', '#FFFACD', '#FFEFD5', '#F5F5DC', '#FAF0E6', '#FDF5E6',
        '#FFFFF0', '#F0FFF0', '#F5FFFA', '#FFFAFA', '#F8F8FF', '#F0F8FF',
        '#ADD8E6', '#B0E0E6', '#87CEFA', '#00BFFF', '#1E90FF', '#6495ED',
        '#4169E1', '#0000CD', '#00008B', '#000080', '#191970', '#8A2BE2',
        '#9400D3', '#9932CC', '#BA55D3', '#DA70D6', '#DDA0DD', '#EE82EE'
      ],
      avoid: []
    },
    autumn: {
      recommended: [
        // Rich & Warm Colors
        '#D63031', '#E17055', '#FDCB6E', '#E84393', '#6C5CE7', '#A29BFE',
        '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B22222', '#DC143C',
        '#800000', '#8B0000', '#FF6347', '#FF4500', '#FF8C00', '#FFA500',
        '#FFD700', '#FFFF00', '#9ACD32', '#32CD32', '#228B22', '#006400',
        '#556B2F', '#808000', '#6B8E23', '#BDB76B', '#F0E68C', '#EEE8AA',
        '#DAA520', '#B8860B', '#CD853F', '#D2B48C', '#F4A460', '#DEB887',
        '#BC8F8F', '#F5DEB3', '#FFDAB9', '#FFE4B5', '#FFEFD5', '#FFF8DC'
      ],
      avoid: []
    },
    winter: {
      recommended: [
        // Bold & Cool Colors
        '#2D3436', '#636E72', '#0984E3', '#6C5CE7', '#E84393', '#FDCB6E',
        '#000000', '#2F3640', '#2C2C54', '#40407A', '#706FD3', '#3742FA',
        '#2ED573', '#7BED9F', '#70A1FF', '#5352ED', '#FF6B6B', '#FF7675',
        '#FDCB6E', '#E17055', '#00D2D3', '#00CEC9', '#6C5CE7', '#A29BFE',
        '#FD79A8', '#FDCB6E', '#E84393', '#00B894', '#74B9FF', '#0984E3',
        '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD',
        '#495057', '#343A40', '#212529', '#FF0000', '#0000FF', '#800080'
      ],
      avoid: []
    }
  }
  
  return colorMap[season as keyof typeof colorMap] || colorMap.autumn
}

/**
 * Convert RGB to hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Check if a clothing color matches the user's skin tone
 */
export const isColorMatch = (clothingColorHex: string, skinAnalysis: SkinToneAnalysis): boolean => {
  // Much more inclusive matching - allow larger color distance and remove avoid colors restriction
  return skinAnalysis.recommendedColors.some(recommended => 
    colorDistance(clothingColorHex, recommended) < 150
  )
}

/**
 * Calculate color distance between two hex colors
 */
const colorDistance = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 100
  
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  )
}

/**
 * Convert hex to RGB
 */
const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Get skin tone description for UI
 */
export const getSkinToneDescription = (analysis: SkinToneAnalysis): string => {
  const seasonDescriptions = {
    spring: 'Bright & Warm',
    summer: 'Soft & Cool', 
    autumn: 'Rich & Warm',
    winter: 'Bold & Cool'
  }
  
  return `${seasonDescriptions[analysis.season]} (${analysis.undertone})`
} 