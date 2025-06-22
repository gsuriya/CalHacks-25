"use client"
import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Camera, Download, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import AnimatedBackground from "../../components/AnimatedBackground"

interface ClosetItem {
  id: string
  name: string
  type: string
  color: string
  image: string
  price: string
  description: string
}

interface TryOnState {
  isProcessing: boolean
  predictionId: string | null
  resultImage: string | null
  error: string | null
  status: string
}

export default function MultiTryOnPage() {
  const searchParams = useSearchParams()
  const [selectedItems, setSelectedItems] = useState<ClosetItem[]>([])
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

  // Load selected items from closet
  useEffect(() => {
    const loadSelectedItems = () => {
      try {
        const itemIds = searchParams.getAll('item')
        console.log('Loading items with IDs:', itemIds)
        
        if (itemIds.length === 0) {
          setLoading(false)
          return
        }

        const savedItems = localStorage.getItem('closetItems')
        if (savedItems) {
          const allItems: ClosetItem[] = JSON.parse(savedItems)
          const items = allItems.filter(item => itemIds.includes(item.id))
          console.log('Found items:', items)
          setSelectedItems(items)
        }
      } catch (error) {
        console.error('Error loading selected items:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSelectedItems()
  }, [searchParams])

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
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

  const startMultiTryOn = async () => {
    if (!capturedImage || selectedItems.length === 0) return

    try {
      setTryOnState({
        isProcessing: true,
        predictionId: null,
        resultImage: null,
        error: null,
        status: 'submitting'
      })

      // Convert garment images to base64 if they're local paths
      const garmentImages = await Promise.all(
        selectedItems.map(async (item) => {
          let garmentImage = item.image
          if (item.image.startsWith('/')) {
            try {
              const imageResponse = await fetch(item.image)
              const imageBlob = await imageResponse.blob()
              garmentImage = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(imageBlob)
              })
            } catch (error) {
              throw new Error(`Failed to load garment image for ${item.name}`)
            }
          }
          return {
            image: garmentImage,
            category: getGarmentCategory(item.type),
            item: item
          }
        })
      )

      // Submit to multi-try-on API
      const response = await fetch('/api/try-on/multi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_image: capturedImage,
          garments: garmentImages,
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
      console.error('Multi try-on error:', error)
      setTryOnState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Multi try-on failed'
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
        throw new Error(data.error?.message || 'Multi try-on processing failed')
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

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId))
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

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-white text-lg mb-4">No items selected</p>
            <Link href="/closet" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">
              Back to Closet
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
        <Link href="/closet" className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <h1 className="text-lg font-semibold gradient-text">Mix & Match Try-On</h1>
        <div className="w-10" />
      </div>

      <div className="relative z-10 px-6">
        {/* Selected Items Info */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-white mb-3">Selected Items ({selectedItems.length})</h3>
          <div className="flex gap-3 overflow-x-auto">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex-shrink-0 relative">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="text-white" size={12} />
                </button>
                <div className="mt-2 text-center">
                  <p className="text-xs text-white font-medium">{item.type}</p>
                  <p className="text-xs text-gray-400">{item.color}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Camera/Photo Section */}
        <div className="aspect-[3/4] rounded-3xl overflow-hidden glass-card relative mb-6">
          {tryOnState.resultImage ? (
            // Show try-on result
            <div className="w-full h-full">
              <img 
                src={tryOnState.resultImage} 
                alt="Multi try-on result" 
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
                    onClick={() => downloadImage(tryOnState.resultImage!, `multi-try-on-${Date.now()}.jpg`)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
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
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-400" />
                    <p className="text-white font-semibold">
                      {tryOnState.status === 'submitting' && 'Submitting to AI...'}
                      {tryOnState.status === 'starting' && 'Starting multi try-on...'}
                      {tryOnState.status === 'in_queue' && 'In queue...'}
                      {tryOnState.status === 'processing' && 'Creating your outfit...'}
                    </p>
                    <p className="text-gray-300 text-sm">This may take up to 60 seconds</p>
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
                        onClick={startMultiTryOn}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 rounded-lg"
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
                      onClick={startMultiTryOn}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-semibold"
                    >
                      Try On Outfit
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
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center animate-pulse-glow"
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
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-teal-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Take Your Photo</h3>
                <p className="text-gray-300 mb-6">Position yourself in frame to try on your selected outfit</p>
                <button
                  onClick={startCamera}
                  className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold animate-pulse-glow"
                >
                  Start Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="glass-card rounded-2xl p-4">
          <h4 className="font-semibold text-white mb-2">Tips for best results:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Stand in good lighting</li>
            <li>• Wear form-fitting clothes</li>
            <li>• Keep your arms slightly away from your body</li>
            <li>• Face the camera directly</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 