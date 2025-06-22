'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { VAPI_CONFIG } from '../lib/vapi-config';
import { handleFilterRequest } from '../src/voice/handleFilterRequest';
import { handleClosetRecommendation } from '../src/voice/handleClosetRecommendation';

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

interface VapiVoiceWidgetProps {
  apiKey?: string;
  assistantId?: string;
  isEnabled: boolean; // Controls whether voice agent is active
  onTranscriptUpdate?: (transcript: Array<{role: string, text: string}>) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onFiltersExtracted?: (filters: VoiceFilters) => void; // Updated to use VoiceFilters
}

const VapiVoiceWidget: React.FC<VapiVoiceWidgetProps> = ({ 
  apiKey, 
  assistantId = VAPI_CONFIG.FASHION_ASSISTANT_ID,
  isEnabled,
  onTranscriptUpdate,
  onConnectionChange,
  onSpeakingChange,
  onFiltersExtracted
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
  
  // Filter detection state
  const [filterModeActive, setFilterModeActive] = useState(false);
  const [filterTranscript, setFilterTranscript] = useState('');
  const [lastTranscriptLength, setLastTranscriptLength] = useState(0);
  
  // Use refs to avoid stale closures in event handlers
  const isConnectedRef = useRef(isConnected);
  const isSpeakingRef = useRef(isSpeaking);
  
  // Update refs when state changes
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Use the provided API key or get from environment/config
  const effectiveApiKey = apiKey || VAPI_CONFIG.API_KEY || "demo_key_replace_with_real_key";

  // Memoize callbacks to prevent unnecessary re-renders
  const handleConnectionChange = useCallback((connected: boolean) => {
    if (onConnectionChange) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onConnectionChange(connected), 0);
    }
  }, [onConnectionChange]);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    if (onSpeakingChange) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onSpeakingChange(speaking), 0);
    }
  }, [onSpeakingChange]);

  const handleTranscriptUpdate = useCallback((newTranscript: Array<{role: string, text: string}>) => {
    if (onTranscriptUpdate) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onTranscriptUpdate(newTranscript), 0);
    }
  }, [onTranscriptUpdate]);

  // Filter extraction handler using our new voice agent
  const handleFilterExtraction = useCallback(async () => {
    if (!filterTranscript.trim()) return;
    
    try {
      console.log('🎤 VapiVoiceWidget: Processing transcript:', filterTranscript);
      
      const text = filterTranscript.toLowerCase();
      console.log('🎤 VapiVoiceWidget: Lowercase text:', text);
      
      // Check if this is a closet recommendation request
      const hasRecommend = text.includes('recommendation') || text.includes('recommend');
      const hasClosetOrTryOn = text.includes('closet') || text.includes('try on');
      const isClosetRecommendation = hasRecommend && hasClosetOrTryOn;
      
      console.log('🎤 VapiVoiceWidget: Detection check:', {
        hasRecommend,
        hasClosetOrTryOn,
        isClosetRecommendation,
        originalText: filterTranscript
      });
      
              if (isClosetRecommendation) {
          console.log('👔 Detected closet recommendation request - calling handleClosetRecommendation');
          
          try {
            const recommendation = await handleClosetRecommendation();
            console.log('👔 Recommendation result:', recommendation);
            
            if (recommendation && recommendation.shirt && recommendation.pant) {
              console.log('👔 Got valid recommendation, navigating to multi try-on...');
              console.log('👔 Shirt:', recommendation.shirt.color, recommendation.shirt.type);
              console.log('👔 Pant:', recommendation.pant.color, recommendation.pant.type);
              console.log('👔 Reasoning:', recommendation.reasoning);
              
              // Navigate to multi try-on with the recommended items
              const queryParams = `item=${recommendation.shirt.id}&item=${recommendation.pant.id}`;
              console.log('👔 Navigating to:', `/try-on/multi?${queryParams}`);
              window.location.href = `/try-on/multi?${queryParams}`;
              return;
            } else {
              console.log('❌ No valid recommendation available');
              if (!recommendation) {
                console.log('❌ Recommendation is null');
              } else if (!recommendation.shirt) {
                console.log('❌ No shirt in recommendation');
              } else if (!recommendation.pant) {
                console.log('❌ No pant in recommendation');
              }
            }
          } catch (error) {
            console.error('❌ Error during closet recommendation:', error);
          }
        } else {
        // Regular filter request
        console.log('🎤 VapiVoiceWidget: Extracting filters from transcript');
        
        const filters = await handleFilterRequest([filterTranscript]);
        console.log('🎤 VapiVoiceWidget: Extracted filters:', filters);
        
        if (filters && Object.keys(filters).some(key => filters[key as keyof VoiceFilters] !== null) && onFiltersExtracted) {
          onFiltersExtracted(filters);
        }
      }
      
      // Reset filter state
      setFilterModeActive(false);
      setFilterTranscript('');
    } catch (error) {
      console.error('🎤 VapiVoiceWidget: Processing failed:', error);
      setFilterModeActive(false);
      setFilterTranscript('');
    }
  }, [filterTranscript, onFiltersExtracted]);

  // Monitor transcript for "filter" or "recommend" keywords and accumulate subsequent text
  useEffect(() => {
    if (transcript.length === 0) return;
    
    // Check if we have new transcript messages
    if (transcript.length > lastTranscriptLength) {
      const newMessages = transcript.slice(lastTranscriptLength);
      setLastTranscriptLength(transcript.length);
      
      // Look for "filter" or "recommend" keywords in new user messages
      for (const message of newMessages) {
        if (message.role === 'user') {
          const text = message.text.toLowerCase();
          
          // Check for clothing requests or closet recommendations - broader detection
          const hasClothingRequest = text.includes('pants') || text.includes('shirt') || text.includes('sweater') || 
                                   text.includes('jeans') || text.includes('trousers') || text.includes('scarf') ||
                                   text.includes('recommend') || text.includes('filter') || text.includes('show me') ||
                                   text.includes('find me') || text.includes('looking for') || text.includes('want');
          
          const hasClosetRequest = (text.includes('recommendation') || text.includes('recommend')) && 
                                 (text.includes('closet') || text.includes('try on'));
          
          if (hasClothingRequest || hasClosetRequest) {
            console.log('🎤 VapiVoiceWidget: Clothing/closet request detected, activating filter mode');
            setFilterModeActive(true);
            setFilterTranscript(message.text); // Use full message text
            console.log('🎤 VapiVoiceWidget: Set filter transcript to:', message.text);
          } else if (filterModeActive) {
            // Accumulate transcript when in filter mode
            setFilterTranscript(prev => prev + ' ' + message.text);
            console.log('🎤 VapiVoiceWidget: Accumulating filter transcript:', filterTranscript + ' ' + message.text);
          }
        }
      }
    }
  }, [transcript, lastTranscriptLength, filterModeActive, filterTranscript]);

  // Handle filter extraction when microphone stops
  useEffect(() => {
    if (!isEnabled && filterModeActive && filterTranscript.trim()) {
      console.log('🎤 VapiVoiceWidget: Microphone stopped, processing filter transcript');
      handleFilterExtraction();
    }
  }, [isEnabled, filterModeActive, filterTranscript, handleFilterExtraction]);

  useEffect(() => {
    const vapiInstance = new Vapi(effectiveApiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Fashion voice agent call started');
      setIsConnected(true);
      handleConnectionChange(true);
    });

    vapiInstance.on('call-end', () => {
      console.log('Fashion voice agent call ended');
      setIsConnected(false);
      setIsSpeaking(false);
      handleConnectionChange(false);
      handleSpeakingChange(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('Fashion assistant started speaking');
      setIsSpeaking(true);
      handleSpeakingChange(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Fashion assistant stopped speaking');
      setIsSpeaking(false);
      handleSpeakingChange(false);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => {
          const updated = [...prev, {
            role: message.role,
            text: message.transcript
          }];
          handleTranscriptUpdate(updated);
          return updated;
        });
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setIsConnected(false);
      setIsSpeaking(false);
      handleConnectionChange(false);
      handleSpeakingChange(false);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [effectiveApiKey, handleTranscriptUpdate, handleConnectionChange, handleSpeakingChange]);

  // Handle enabling/disabling the voice agent based on mic state
  useEffect(() => {
    if (!vapi) return;

    if (isEnabled && !isConnected) {
      // Start voice agent when mic is enabled
      console.log('Starting voice agent...');
      vapi.start(assistantId);
    } else if (!isEnabled && isConnected) {
      // Stop voice agent when mic is disabled
      console.log('Stopping voice agent...');
      vapi.stop();
    }
  }, [isEnabled, isConnected, vapi, assistantId]);

  // This component doesn't render any UI - it just handles voice logic
  return null;
};

export default VapiVoiceWidget; 