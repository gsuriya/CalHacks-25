interface FilterResponse {
  colors?: string[]
  stores?: string[]
  materials?: string[]
  occasions?: string[]
  seasons?: string[]
  priceMin?: number
  priceMax?: number
  inStock?: boolean
}

export async function parseVoiceToFilters(transcript: string): Promise<FilterResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('Gemini API key not found')
    return {}
  }

  const prompt = `
Extract clothing filter preferences from this user speech: "${transcript}"

Available filter options:
- Colors: Red, Blue, Green, Black, White, Pink, Purple, Orange, Yellow, Brown, Gray, Navy, Beige, Cream, Tan, Gold, Silver, Burgundy, Maroon, Olive, Teal, Turquoise, Coral, Salmon, Khaki, Mint, Lavender, Ivory
- Stores: Uniqlo, H&M, Zara, Nike, Adidas, Forever21, Target, Walmart, Amazon, Gap
- Materials: Cotton, Silk, Wool, Polyester, Denim, Linen, Leather, Cashmere, Spandex, Nylon
- Occasions: Casual, Formal, Work, Party, Sports, Beach, Wedding, Date, Business, Vacation
- Seasons: Spring, Summer, Autumn, Winter
- Price: extract numeric values for min/max price ranges
- InStock: boolean for availability (true if user mentions "in stock" or "available")

Return ONLY a valid JSON object with the extracted filters. If no specific filter is mentioned, omit that field.
Use exact case matching for the available options above.

Examples:
- "I want green casual clothes" → {"colors": ["Green"], "occasions": ["Casual"]}
- "Show me formal blue shirts under 50 dollars" → {"colors": ["Blue"], "occasions": ["Formal"], "priceMax": 50}
- "I need winter cotton clothes that are in stock" → {"seasons": ["Winter"], "materials": ["Cotton"], "inStock": true}
- "Red and blue dresses for parties" → {"colors": ["Red", "Blue"], "occasions": ["Party"]}

JSON response only:
`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      console.error('No response text from Gemini')
      return {}
    }

    console.log('Gemini raw response:', responseText)

    // Clean up the response to extract JSON
    const cleanedResponse = responseText
      .replace(/```json|```/g, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .trim()

    const parsedFilters = JSON.parse(cleanedResponse)
    console.log('Parsed filters:', parsedFilters)
    
    return parsedFilters
  } catch (error) {
    console.error('Error parsing voice to filters:', error)
    return {}
  }
}

export type { FilterResponse } 