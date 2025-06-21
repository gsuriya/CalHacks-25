import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
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

    // Check status with FASHN API
    const fashnResponse = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${fashnApiKey}`
      }
    })

    if (!fashnResponse.ok) {
      const errorText = await fashnResponse.text()
      console.error('FASHN API status error:', errorText)
      return NextResponse.json(
        { error: 'Failed to check try-on status' },
        { status: fashnResponse.status }
      )
    }

    const data = await fashnResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Try-on status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 