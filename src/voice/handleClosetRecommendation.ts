import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

interface ClosetItem {
  id: string
  name: string
  type: string
  color: string
  image: string
  price: string
  description: string
}

interface RecommendationResult {
  shirt: ClosetItem | null
  pant: ClosetItem | null
  reasoning: string
}

export async function handleClosetRecommendation(): Promise<RecommendationResult | null> {
  try {
    console.log('👔 Starting closet recommendation...')
    
    // Get closet items from localStorage
    const savedItems = localStorage.getItem('closetItems')
    if (!savedItems) {
      console.log('❌ No closet items found')
      return null
    }

    const closetItems: ClosetItem[] = JSON.parse(savedItems)
    console.log('👔 Found', closetItems.length, 'items in closet')

    // Filter shirts and pants
    const shirts = closetItems.filter(item => 
      ['t-shirt', 'shirt', 'sweater', 'long sleeve', 'blouse', 'top'].includes(item.type.toLowerCase())
    )
    const pants = closetItems.filter(item => 
      ['pants', 'jeans', 'trousers', 'bottoms', 'shorts'].includes(item.type.toLowerCase())
    )

    console.log('👔 Available options:')
    console.log('  - Shirts/Tops:', shirts.length)
    console.log('  - Pants/Bottoms:', pants.length)

    if (shirts.length === 0 || pants.length === 0) {
      console.log('❌ Need at least one shirt and one pant for recommendation')
      return null
    }

    // Create detailed item descriptions for Gemini
    const shirtDescriptions = shirts.map(item => 
      `ID: ${item.id}, Type: ${item.type}, Color: ${item.color}, Description: ${item.description}`
    ).join('\n')
    
    const pantDescriptions = pants.map(item => 
      `ID: ${item.id}, Type: ${item.type}, Color: ${item.color}, Description: ${item.description}`
    ).join('\n')

    const prompt = `
You are a professional fashion stylist. I need you to recommend the BEST color-coordinated outfit from my closet items.

AVAILABLE SHIRTS/TOPS:
${shirtDescriptions}

AVAILABLE PANTS/BOTTOMS:
${pantDescriptions}

TASK: Choose ONE shirt and ONE pant that would look great together based on color coordination and style matching.

RULES:
1. Focus primarily on color harmony (complementary, analogous, or neutral combinations)
2. Consider the style/formality level (casual with casual, dressy with dressy)
3. Return ONLY a JSON object with this exact format:

{
  "shirtId": "ID_of_chosen_shirt",
  "pantId": "ID_of_chosen_pant", 
  "reasoning": "Brief explanation of why these colors and styles work well together"
}

EXAMPLES of good color combinations:
- Navy/Blue with White, Beige, Gray, or Khaki
- Black with White, Gray, or any bright color
- White with any color
- Brown/Tan with Cream, White, or Navy
- Gray with any color (neutral)

Choose the BEST combination from my available items:
`.trim()

    console.log('📝 Sending recommendation prompt to Gemini...')
    console.log('📝 Prompt:', prompt)
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const raw = response.text().trim()

    console.log('🤖 Gemini recommendation response:', raw)

    // Strip markdown formatting if present
    let jsonString = raw;
    if (raw.startsWith('```json') && raw.endsWith('```')) {
      jsonString = raw.slice(7, -3).trim();
    } else if (raw.startsWith('```') && raw.endsWith('```')) {
      jsonString = raw.slice(3, -3).trim();
    }

    try {
      const recommendation = JSON.parse(jsonString)
      console.log('✅ Parsed recommendation:', recommendation)

      // Find the recommended items
      const recommendedShirt = shirts.find(item => item.id === recommendation.shirtId)
      const recommendedPant = pants.find(item => item.id === recommendation.pantId)

      if (!recommendedShirt || !recommendedPant) {
        console.error('❌ Could not find recommended items in closet')
        return null
      }

      console.log('👔 Recommended outfit:')
      console.log('  - Shirt:', recommendedShirt.color, recommendedShirt.type)
      console.log('  - Pant:', recommendedPant.color, recommendedPant.type)
      console.log('  - Reasoning:', recommendation.reasoning)

      return {
        shirt: recommendedShirt,
        pant: recommendedPant,
        reasoning: recommendation.reasoning
      }

    } catch (parseError) {
      console.error('❌ Failed to parse recommendation response:', parseError)
      return null
    }

  } catch (error) {
    console.error('❌ Error in closet recommendation:', error)
    return null
  }
} 