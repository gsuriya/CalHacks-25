/**
 * Shared skin tone storage utility
 * Handles storing and retrieving skin tone analysis across pages
 */

import { analyzeSkinTone, SkinToneAnalysis } from './skin-tone-analysis'

const SKIN_TONE_KEY = 'styleai-skin-tone-analysis'

/**
 * Analyze skin tone from image and store it
 */
export const analyzeAndStoreSkinTone = async (imageDataUrl: string): Promise<SkinToneAnalysis> => {
  try {
    const analysis = await analyzeSkinTone(imageDataUrl)
    
    // Store in localStorage
    localStorage.setItem(SKIN_TONE_KEY, JSON.stringify(analysis))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('skinToneUpdated', { detail: analysis }))
    
    return analysis
  } catch (error) {
    console.error('Failed to analyze and store skin tone:', error)
    throw error
  }
}

/**
 * Get stored skin tone analysis
 */
export const getStoredSkinTone = (): SkinToneAnalysis | null => {
  try {
    const stored = localStorage.getItem(SKIN_TONE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to retrieve stored skin tone:', error)
    return null
  }
}

/**
 * Clear stored skin tone analysis
 */
export const clearStoredSkinTone = (): void => {
  localStorage.removeItem(SKIN_TONE_KEY)
  window.dispatchEvent(new CustomEvent('skinToneUpdated', { detail: null }))
}

/**
 * Hook to listen for skin tone updates
 */
export const useSkinToneListener = (callback: (analysis: SkinToneAnalysis | null) => void) => {
  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('skinToneUpdated', handleUpdate as EventListener)
    
    return () => {
      window.removeEventListener('skinToneUpdated', handleUpdate as EventListener)
    }
  }
  
  return () => {}
} 