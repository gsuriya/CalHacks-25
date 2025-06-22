import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

interface VoiceFilters {
  color: string | null
  type: string | null
  priceMin: number | null
  priceMax: number | null
  store: string | null
  inStockMin: number | null
  material: string | null
  occasion: string | null
  season: string | null
}

export async function handleFilterRequest(latestTurns: string[]) {
  try {
    const userRequest = latestTurns[latestTurns.length - 1]
    console.log('🎤 Voice Request:', userRequest)

    const prompt = `
You are "FilterBuilder", a function-style assistant that MUST follow these rules:
1. Return ONLY a JSON object with these exact keys:
{
  "color": null | "Any Color" | "Beige" | "Black" | "Blue" | "Brown" | "Burgundy" | "Cream" | "Gray" | "Green" | "Navy" | "Purple" | "Red" | "White" | "Yellow",
  "type": null | "t-shirt" | "sweater" | "scarf" | "long sleeve" | "pants",
  "priceMin": null | number,
  "priceMax": null | number,
  "store": null | "Uniqlo" | "Zara" | "H&M" | "Gap" | "Patagonia",
  "inStockMin": null | number,
  "material": null | "Acrylic Blend" | "Bamboo" | "Cashmere" | "Cotton" | "Cotton Blend" | "Cotton Knit" | "Merino Wool" | "Modal" | "Organic Cotton" | "Silk" | "Wool",
  "occasion": null | "Casual" | "Work" | "Party" | "Weekend",
  "season": null | "Spring" | "Summer"
}

2. CRITICAL RULES:
• When ANY clothing type is mentioned (pants, shirt, etc), you MUST set both:
  - "type" field to the matching type
  - "color" field if a color is mentioned
• ALWAYS map clothing types to their exact values:
  - "pants", "trousers", "jeans", "slacks", "bottoms" → set type: "pants"
  - "shirt", "tee", "tshirt" → set type: "t-shirt"
  - "jumper", "pullover" → set type: "sweater"
  - "wrap", "shawl" → set type: "scarf"
  - "longsleeve", "long sleeve shirt" → set type: "long sleeve"

3. EXAMPLES (you must follow this exact format):
"Show me red pants" → {"color": "Red", "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}
"I want blue jeans" → {"color": "Blue", "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}
"Find me trousers" → {"color": null, "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}

USER REQUEST: ${userRequest}
`.trim()

    console.log('📝 Sending prompt to Gemini...')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const raw = response.text().trim()

    console.log('🤖 Gemini raw response:', raw)

    let filters: VoiceFilters
    try { 
      filters = JSON.parse(raw)
      
      // Validate that both color and type are set when appropriate
      const requestLower = userRequest.toLowerCase()
      const hasClothingType = requestLower.includes('pants') || 
                             requestLower.includes('jeans') || 
                             requestLower.includes('trousers') || 
                             requestLower.includes('shirt') || 
                             requestLower.includes('sweater') || 
                             requestLower.includes('scarf')
      
      console.log('🔍 Request Analysis:', {
        originalRequest: userRequest,
        hasClothingType,
        detectedWords: {
          pants: requestLower.includes('pants'),
          jeans: requestLower.includes('jeans'),
          trousers: requestLower.includes('trousers'),
          shirt: requestLower.includes('shirt'),
          sweater: requestLower.includes('sweater'),
          scarf: requestLower.includes('scarf')
        }
      })

      console.log('🎯 Parsed Filters:', {
        color: filters.color,
        type: filters.type,
        allSetFields: Object.entries(filters)
          .filter(([_, v]) => v !== null)
          .map(([k]) => k)
      })

      // If clothing type mentioned but type not set, retry with more explicit prompt
      if (hasClothingType && !filters.type) {
        console.warn('⚠️ Warning: Clothing type mentioned but type not set in response')
        return null
      }

      if (typeof window !== 'undefined') {
        console.log('💾 Saving filters to localStorage:', filters)
        localStorage.setItem("activeFilters", JSON.stringify(filters))
        
        console.log('📢 Dispatching voiceFilterUpdate event')
        const event = new CustomEvent('voiceFilterUpdate', {
          detail: { filters }
        })
        window.dispatchEvent(event)
        console.log('✅ Event dispatched successfully')
      }
      
      return filters

    } catch (parseError) { 
      console.error('❌ Failed to parse Gemini response:', parseError)
      return 
    }
  } catch (error) {
    console.error('❌ Error in handleFilterRequest:', error)
    return null
  }
} 