import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_image, garment_image, category = 'auto', mode = 'balanced' } = body

    if (!model_image || !garment_image) {
      return NextResponse.json(
        { error: 'model_image and garment_image are required' },
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

    // Call FASHN API
    const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fashnApiKey}`
      },
      body: JSON.stringify({
        model_image,
        garment_image,
        category,
        mode,
        output_format: 'jpeg',
        return_base64: false,
        num_samples: 1
      })
    })

    if (!fashnResponse.ok) {
      const errorText = await fashnResponse.text()
      console.error('FASHN API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to start try-on process' },
        { status: fashnResponse.status }
      )
    }

    const data = await fashnResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Try-on API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 