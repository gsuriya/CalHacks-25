"use client"
import { useState, useRef, useEffect, use } from "react"
import { ArrowLeft, Camera, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import AnimatedBackground from "../../components/AnimatedBackground"

interface Product {
  id: string
  image: string
  description: string
  type: string
  color: string
  price: string
  stock_status: string
}

interface TryOnState {
  isProcessing: boolean
  predictionId: string | null
  resultImage: string | null
  error: string | null
  status: string
}

export default function TryOnPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [tryOnState, setTryOnState] = useState<TryOnState>({
    isProcessing: false,
    predictionId: null,
    resultImage: null,
    error: null,
    status: ''
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://backend-879168005744.us-west1.run.app/products/${resolvedParams.productId}/display`)
        if (response.ok) {
          const data = await response.json()
          setProduct({
            id: data.id,
            image: data.image,
            description: data.description,
            type: data.type,
            color: data.color,
            price: data.price,
            stock_status: data.stock_status
          })
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [resolvedParams.productId])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      console.log('Attaching stream to video element')
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().then(() => {
        console.log('Video element started playing')
      }).catch((error) => {
        console.error('Error playing video:', error)
      })
    }
  }, [cameraActive])

  const startCamera = async () => {
    console.log('Starting camera...')
    try {
      // Clean up any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      console.log('Requesting camera access...')
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
      
      // Immediately set camera active to render the video element
      setCameraActive(true)
      console.log('Camera started successfully')
    } catch (error) {
      console.error('Error starting camera:', error)
      alert(`Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setTryOnState({
      isProcessing: false,
      predictionId: null,
      resultImage: null,
      error: null,
      status: ''
    })
    startCamera()
  }

  const startTryOn = async () => {
    if (!capturedImage || !product) return

    try {
      setTryOnState({
        isProcessing: true,
        predictionId: null,
        resultImage: null,
        error: null,
        status: 'submitting'
      })

      // Submit to FASHN API
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_image: capturedImage,
          garment_image: product.image,
          category: getGarmentCategory(product.type),
          mode: 'balanced'
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const predictionId = data.id

      setTryOnState(prev => ({ 
        ...prev, 
        predictionId,
        status: 'processing'
      }))

      // Poll for results
      pollTryOnStatus(predictionId)

    } catch (error) {
      console.error('Try-on error:', error)
      setTryOnState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Try-on failed'
      }))
    }
  }

  const pollTryOnStatus = async (predictionId: string) => {
    try {
      const response = await fetch(`/api/try-on/${predictionId}`)
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'completed') {
        setTryOnState(prev => ({
          ...prev,
          isProcessing: false,
          resultImage: data.output[0],
          status: 'completed'
        }))
      } else if (data.status === 'failed') {
        throw new Error(data.error?.message || 'Try-on processing failed')
      } else if (['starting', 'in_queue', 'processing'].includes(data.status)) {
        setTryOnState(prev => ({ ...prev, status: data.status }))
        // Continue polling
        setTimeout(() => pollTryOnStatus(predictionId), 3000)
      }
    } catch (error) {
      console.error('Polling error:', error)
      setTryOnState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to get try-on results'
      }))
    }
  }

  const getGarmentCategory = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'T-Shirt': 'tops',
      'Shirt': 'tops',
      'Blouse': 'tops',
      'Sweater': 'tops',
      'Hoodie': 'tops',
      'Jacket': 'tops',
      'Blazer': 'tops',
      'Pants': 'bottoms',
      'Jeans': 'bottoms',
      'Shorts': 'bottoms',
      'Skirt': 'bottoms',
      'Dress': 'one-pieces',
      'Jumpsuit': 'one-pieces'
    }
    return typeMap[type] || 'auto'
  }

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-white text-lg mb-4">Product not found</p>
            <Link href="/swipe" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">
              Back to Swipe
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Link href="/swipe" className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <h1 className="text-lg font-semibold gradient-text">Virtual Try-On</h1>
        <div className="w-10" />
      </div>

      <div className="relative z-10 px-6">
        {/* Product Info */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <img 
              src={product.image} 
              alt={product.description} 
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-white">{product.type}</h2>
              <p className="text-gray-300 text-sm">{product.color}</p>
              <p className="text-purple-400 font-semibold">{product.price}</p>
            </div>
          </div>
        </div>

        {/* Camera/Photo Section */}
        <div className="aspect-[3/4] rounded-3xl overflow-hidden glass-card relative mb-6">
          {tryOnState.resultImage ? (
            // Show try-on result
            <div className="w-full h-full">
              <img 
                src={tryOnState.resultImage} 
                alt="Try-on result" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex gap-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => downloadImage(tryOnState.resultImage!, `try-on-${product.id}.jpg`)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : capturedImage ? (
            // Show captured photo with try-on option
            <div className="w-full h-full">
              <img 
                src={capturedImage} 
                alt="Captured photo" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4">
                {tryOnState.isProcessing ? (
                  <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-white font-semibold">
                      {tryOnState.status === 'submitting' && 'Submitting to AI...'}
                      {tryOnState.status === 'starting' && 'Starting try-on...'}
                      {tryOnState.status === 'in_queue' && 'In queue...'}
                      {tryOnState.status === 'processing' && 'Creating your try-on...'}
                    </p>
                    <p className="text-gray-300 text-sm">This may take up to 40 seconds</p>
                  </div>
                ) : tryOnState.error ? (
                  <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-red-400 mb-3">{tryOnState.error}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={retakePhoto}
                        className="flex-1 bg-white/20 text-white py-2 rounded-lg"
                      >
                        Retake
                      </button>
              <button
                        onClick={startTryOn}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg"
              >
                        Retry
              </button>
            </div>
          </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={retakePhoto}
                      className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold"
                    >
                      Retake
                    </button>
                    <button
                      onClick={startTryOn}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold"
                    >
                      Try On
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : cameraActive ? (
            // Show live camera feed
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover bg-black"
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => console.log('Video element loaded metadata')}
                onPlay={() => console.log('Video element started playing')}
                onError={(e) => console.error('Video element error:', e)}
              />
              {/* Debug overlay */}
              <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
                Camera Active: {cameraActive ? 'Yes' : 'No'}
                <br />
                Stream: {streamRef.current ? 'Connected' : 'None'}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow"
                  >
                    <Camera className="text-white" size={24} />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <span className="text-white text-sm">×</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Show start camera prompt
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                  <Camera size={32} className="text-white" />
                </div>
                <p className="text-white font-semibold mb-2">Ready to try on?</p>
                <p className="text-gray-300 text-sm mb-4">Take a photo to see how this looks on you</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
                >
                  Start Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-white mb-2">How it works:</h3>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. Click "Start Camera" to begin</li>
            <li>2. Position yourself in the frame</li>
            <li>3. Take a photo when ready</li>
            <li>4. Click "Try On" to see the magic!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
