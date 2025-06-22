import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_image, garments, mode = 'balanced' } = body

    if (!model_image || !garments || !Array.isArray(garments) || garments.length === 0) {
      return NextResponse.json(
        { error: 'model_image and garments array are required' },
        { status: 400 }
      )
    }

    if (garments.length > 2) {
      return NextResponse.json(
        { error: 'Maximum 2 garments allowed for multi try-on' },
        { status: 400 }
      )
    }

    const fashnApiKey = process.env.FASHN_API_KEY
    if (!fashnApiKey) {
      return NextResponse.json(
        { error: 'FASHN API key not configured' },
        { status: 500 }
      )
    }

    // For multiple garments, we need to process them sequentially
    // Start with the first garment (usually bottoms if present, then tops)
    const sortedGarments = garments.sort((a: any, b: any) => {
      const order: { [key: string]: number } = { 'bottoms': 0, 'tops': 1, 'one-pieces': 2, 'auto': 3 }
      return (order[a.category] || 3) - (order[b.category] || 3)
    })

    console.log('Processing garments in order:', sortedGarments.map(g => g.category))

    let currentModelImage = model_image
    let predictionId = ''

    // Process each garment sequentially
    for (let i = 0; i < sortedGarments.length; i++) {
      const garment = sortedGarments[i]
      
      console.log(`Processing garment ${i + 1}/${sortedGarments.length}: ${garment.category}`)

      // Call FASHN API for this garment
      const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fashnApiKey}`
        },
        body: JSON.stringify({
          model_image: currentModelImage,
          garment_image: garment.image,
          category: garment.category,
          mode,
          output_format: 'jpeg',
          return_base64: false,
          num_samples: 1
        })
      })

      if (!fashnResponse.ok) {
        const errorText = await fashnResponse.text()
        console.error(`FASHN API error for garment ${i + 1}:`, errorText)
        return NextResponse.json(
          { error: `Failed to process garment ${i + 1}: ${garment.category}` },
          { status: fashnResponse.status }
        )
      }

      const data = await fashnResponse.json()
      predictionId = data.id

      // Wait for this garment to complete before processing the next
      if (i < sortedGarments.length - 1) {
        console.log(`Waiting for garment ${i + 1} to complete...`)
        const result = await waitForCompletion(predictionId, fashnApiKey)
        if (result.error) {
          return NextResponse.json(
            { error: `Failed to complete garment ${i + 1}: ${result.error}` },
            { status: 500 }
          )
        }
        // Use the result as input for the next garment
        currentModelImage = result.output[0]
        console.log(`Garment ${i + 1} completed, using result for next garment`)
      }
    }

    // Return the final prediction ID
    return NextResponse.json({ id: predictionId })

  } catch (error) {
    console.error('Multi try-on API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function waitForCompletion(predictionId: string, apiKey: string): Promise<any> {
  const maxAttempts = 40 // 40 attempts * 3 seconds = 2 minutes max
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'completed') {
        return data
      } else if (data.status === 'failed') {
        return { error: data.error?.message || 'Processing failed' }
      } else if (['starting', 'in_queue', 'processing'].includes(data.status)) {
        // Continue waiting
        await new Promise(resolve => setTimeout(resolve, 3000))
        attempts++
      } else {
        return { error: `Unknown status: ${data.status}` }
      }
    } catch (error) {
      console.error('Error checking status:', error)
      return { error: 'Failed to check processing status' }
    }
  }

  return { error: 'Processing timeout' }
} 